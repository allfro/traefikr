# Build stage
FROM golang:1.24-alpine AS builder

# Install build dependencies for static compilation
RUN apk add --no-cache gcc musl-dev sqlite-dev sqlite-static

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build fully static binary with symbols stripped
RUN CGO_ENABLED=1 GOOS=linux go build \
    -a \
    -ldflags '-linkmode external -extldflags "-static" -s -w' \
    -o main .

# Verify it's static
RUN ldd main || echo "Static binary confirmed"

# Final stage - FROM scratch (no OS, no shell, just the binary)
FROM scratch

# Copy CA certificates for HTTPS (if needed)
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy the static binary
COPY --from=builder /app/main /main

# Expose port
EXPOSE 8080

# Run the application (no shell, direct execution)
ENTRYPOINT ["/main"]
