const DEFAULT_API_BASE_URL = 'http://localhost:8080';

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

export const apiBaseUrl = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
);

export const swaggerUrl =
  import.meta.env.VITE_SWAGGER_URL || `${apiBaseUrl}/swagger-ui.html`;
