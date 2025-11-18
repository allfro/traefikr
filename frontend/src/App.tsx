import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Routers from '@/pages/Routers'
import RouterTypeSelector from '@/pages/RouterTypeSelector'
import HTTPRouterForm from '@/pages/HTTPRouterForm'
import TCPRouterForm from '@/pages/TCPRouterForm'
import UDPRouterForm from '@/pages/UDPRouterForm'
import Services from '@/pages/Services'
import ServiceTypeSelector from '@/pages/ServiceTypeSelector'
import ServiceSubtypeSelector from '@/pages/ServiceSubtypeSelector'
import HTTPServiceForm from '@/pages/HTTPServiceForm'
import TCPServiceForm from '@/pages/TCPServiceForm'
import UDPServiceForm from '@/pages/UDPServiceForm'
import Middlewares from '@/pages/Middlewares'
import MiddlewareProtocolSelector from '@/pages/MiddlewareProtocolSelector'
import MiddlewareTypeSelector from '@/pages/MiddlewareTypeSelector'
import HTTPMiddlewareForm from '@/pages/HTTPMiddlewareForm'
import Settings from '@/pages/Settings'
import Entrypoints from '@/pages/Entrypoints'
import TLS from '@/pages/TLS'
import TLSCertificateForm from '@/pages/TLSCertificateForm'
import TLSOptionForm from '@/pages/TLSOptionForm'
import ServersTransports from '@/pages/ServersTransports.tsx'
import ServersTransportTypeSelector from '@/pages/ServersTransportTypeSelector.tsx'
import HTTPServerTransportForm from '@/pages/HTTPServerTransportForm'
import TCPServerTransportForm from '@/pages/TCPServerTransportForm'
import Login from '@/pages/Login'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'

function App() {
  console.log('[APP] Render')

  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="routers" element={<Routers />} />
          <Route path="routers/new" element={<RouterTypeSelector />} />
          <Route path="routers/new/http" element={<HTTPRouterForm />} />
          <Route path="routers/new/tcp" element={<TCPRouterForm />} />
          <Route path="routers/new/udp" element={<UDPRouterForm />} />
          <Route path="routers/http/:name/edit" element={<HTTPRouterForm />} />
          <Route path="routers/tcp/:name/edit" element={<TCPRouterForm />} />
          <Route path="routers/udp/:name/edit" element={<UDPRouterForm />} />
          <Route path="services" element={<Services />} />
          <Route path="services/new" element={<ServiceTypeSelector />} />
          <Route path="services/new/:protocol/select-type" element={<ServiceSubtypeSelector />} />
          <Route path="services/new/http/:subtype" element={<HTTPServiceForm />} />
          <Route path="services/new/tcp/:subtype" element={<TCPServiceForm />} />
          <Route path="services/new/udp/:subtype" element={<UDPServiceForm />} />
          <Route path="services/http/:name/edit" element={<HTTPServiceForm />} />
          <Route path="services/tcp/:name/edit" element={<TCPServiceForm />} />
          <Route path="services/udp/:name/edit" element={<UDPServiceForm />} />
          <Route path="middlewares" element={<Middlewares />} />
          <Route path="middlewares/new" element={<MiddlewareProtocolSelector />} />
          <Route path="middlewares/new/:protocol" element={<MiddlewareTypeSelector />} />
          <Route path="middlewares/new/:protocol/:middlewareType" element={<HTTPMiddlewareForm />} />
          <Route path="middlewares/:protocol/:name/edit" element={<HTTPMiddlewareForm />} />
          <Route path="settings" element={<Settings />} />
          <Route path="entrypoints" element={<Entrypoints />} />
          <Route path="tls" element={<TLS />} />
          <Route path="tls/certificates/new" element={<TLSCertificateForm />} />
          <Route path="tls/certificates/:name/edit" element={<TLSCertificateForm />} />
          <Route path="tls/options/new" element={<TLSOptionForm />} />
          <Route path="tls/options/:name/edit" element={<TLSOptionForm />} />
          <Route path="serversTransports" element={<ServersTransports />} />
          <Route path="serversTransports/new" element={<ServersTransportTypeSelector />} />
          <Route path="serversTransports/new/http" element={<HTTPServerTransportForm />} />
          <Route path="serversTransports/new/tcp" element={<TCPServerTransportForm />} />
          <Route path="serversTransports/http/:name/edit" element={<HTTPServerTransportForm />} />
          <Route path="serversTransports/tcp/:name/edit" element={<TCPServerTransportForm />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App