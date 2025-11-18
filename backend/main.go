package main

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"log"
	"os"
	"strings"

	"traefikr/dal"
	"traefikr/handlers"
	"traefikr/middleware"
	"traefikr/models"
	"traefikr/utils"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	// Initialize database
	db, err := models.InitDB()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Initialize repositories
	userRepo := dal.NewUserRepository(db)
	apiKeyRepo := dal.NewAPIKeyRepository(db)
	configRepo := dal.NewTraefikConfigRepository(db)

	// Check if admin user exists, if not create one
	count, err := userRepo.Count()
	if err != nil {
		log.Fatalf("Failed to count users: %v", err)
	}
	if count == 0 {
		// Generate random password
		password := generateRandomPassword(16)
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			log.Fatalf("Failed to hash password: %v", err)
		}

		admin := &models.User{
			Username:     "admin",
			PasswordHash: string(hashedPassword),
			IsActive:     true,
		}

		if err := userRepo.Create(admin); err != nil {
			log.Fatalf("Failed to create admin user: %v", err)
		}

		fmt.Println("======================================")
		fmt.Printf("Initial Admin Credentials\n")
		fmt.Printf("Username: admin\n")
		fmt.Printf("Password: %s\n", password)
		fmt.Println("======================================")
		fmt.Println("Please save these credentials! The password will not be shown again.")
	}

	// Bootstrap: Restore serverTransport TOML files on startup
	tomlWriter := utils.NewTomlWriter()
	if err := dal.BootstrapServerTransports(configRepo, tomlWriter); err != nil {
		log.Printf("WARNING: Failed to bootstrap serverTransports: %v", err)
	}

	// Initialize Gin router
	r := gin.Default()

	// Set up routes
	setupRoutes(r, userRepo, apiKeyRepo, configRepo)

	// Start server
	port := os.Getenv("TRAEFIKR_PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting server on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func generateRandomPassword(length int) string {
	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		log.Fatalf("Failed to generate random password: %v", err)
	}
	return base64.URLEncoding.EncodeToString(b)[:length]
}

func setupRoutes(r *gin.Engine, userRepo *dal.UserRepository, apiKeyRepo *dal.APIKeyRepository, configRepo *dal.TraefikConfigRepository) {
	// CORS middleware - allow all origins, methods, and auth headers
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-traefikr-key")
		c.Writer.Header().Set("Access-Control-Expose-Headers", "Content-Length")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Initialize handlers
	resourceHandler := handlers.NewResourceHandler(configRepo)
	configHandler := handlers.NewConfigHandler(configRepo)
	providerHandler := handlers.NewProviderHandler(apiKeyRepo)
	authHandler := handlers.NewAuthHandler(userRepo)

	// 1. Health check (public)
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// 2. API routes
	api := r.Group("/api")
	{
		// Authentication endpoints (public)
		api.POST("/auth/login", authHandler.Login)

		// Schema endpoints (public)
		api.GET("/:protocol/:type/schema.json", resourceHandler.GetSchema)

		// Config endpoint (conditional API key auth - for Traefik polling)
		// Requires x-traefikr-key header if API keys exist in database
		api.GET("/config", middleware.ConditionalAuthMiddleware(apiKeyRepo), configHandler.GetConfig)

		// Protected endpoints (require JWT token from user login)
		protected := api.Group("")
		protected.Use(middleware.JWTAuthMiddleware(userRepo))
		{
			// Auth endpoints (password change)
			protected.PUT("/auth/password", authHandler.ChangePassword)

			// Resource endpoints
			protected.GET("/:protocol/:type", resourceHandler.ListResources)
			protected.GET("/:protocol/:type/:nameProvider", resourceHandler.GetResource)
			protected.POST("/:protocol/:type", resourceHandler.CreateResource)
			protected.PUT("/:protocol/:type/:nameProvider", resourceHandler.UpdateResource)
			protected.DELETE("/:protocol/:type/:nameProvider", resourceHandler.DeleteResource)

			// Provider (API key management for Traefik)
			protected.GET("/http/provider", providerHandler.ListAPIKeys)
			protected.POST("/http/provider", providerHandler.CreateAPIKey)
			protected.DELETE("/http/provider/:id", providerHandler.DeleteAPIKey)
		}
	}

	// 3. Static assets and SPA routing
	r.Static("/assets", "/static/assets")
	r.StaticFile("/", "/static/index.html")
	r.StaticFile("/index.html", "/static/index.html")
	r.StaticFile("/traefikr_logo.svg", "/static/traefikr_logo.svg")

	// 4. SPA fallback - serve index.html for all other routes
	r.NoRoute(func(c *gin.Context) {
		// If it's an API route that doesn't exist, return 404 JSON
		if strings.HasPrefix(c.Request.URL.Path, "/api/") {
			c.JSON(404, gin.H{"error": "Not found"})
			return
		}

		// Everything else gets index.html (SPA client-side routing)
		c.File("/static/index.html")
	})
}
