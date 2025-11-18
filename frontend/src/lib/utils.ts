import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import _ from 'lodash'
import {singular} from "pluralize";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getProviderIcon(provider: string) {
  switch (provider) {
    case 'file':
      return 'file-text'
    case 'docker':
      return 'container'
    case 'docker_swarm':
      return 'layers'
    default:
      return 'box'
  }
}

export function getProviderColor(provider: string) {
  switch (provider) {
    case 'file':
      return 'text-blue-500 bg-blue-50'
    case 'docker':
      return 'text-cyan-500 bg-cyan-50'
    case 'docker_swarm':
      return 'text-purple-500 bg-purple-50'
    default:
      return 'text-gray-500 bg-gray-50'
  }
}

export function getProviderLabel(provider: string) {
  switch (provider) {
    case 'file':
      return 'File'
    case 'docker':
      return 'Docker'
    case 'kubernetes':
      return 'Kubernetes'
    case 'consul':
      return 'Consul'
    case 'etcd':
      return 'etcd'
    case 'http':
      return 'HTTP'
    case 'internal':
      return 'Traefik Internal'
  }

  return _.capitalize(provider)
}

export function getResourceTypeLabel(resourceType: string, capitalize = true, plural = true) {
  let label = resourceType;

  switch(resourceType) {
    case 'middlewares':
      label = 'Middlewares';
      break;
    case 'services':
      label = 'Services';
      break;
    case 'serversTransports':
      label = 'Servers Transports';
      break;
    case 'tlsOptions':
      label = 'TLS Options';
      break;
    case 'routers':
      label = 'Routers';
      break;
  }

  if (!capitalize)
    label = label.toLowerCase();
  if (!plural)
    label = singular(label);

  return label

}

export function getProtocolLabel(protocol: string = 'HTTP') {
  switch(protocol) {
    case 'http':
      return 'HTTP';
    case 'tcp':
      return 'TCP';
    case 'udp':
      return 'UDP';
  }
}