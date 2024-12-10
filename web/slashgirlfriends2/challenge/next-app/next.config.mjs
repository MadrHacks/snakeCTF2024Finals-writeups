/** @type {import('next').NextConfig} */
// const cspHeader = `
//     default-src 'self';
//     script-src 'self' 'unsafe-eval' 'unsafe-inline' *;
//     style-src 'self' 'unsafe-inline';
//     img-src 'self' blob: data:;
//     font-src 'self';
//     object-src 'none';
//     form-action 'self';
//     frame-ancestors 'none';
// `;

const nextConfig = {
  reactStrictMode: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "*",
        pathname: "/**",
      }
    ]
  },
  // async headers() {
  //   return [
  //     {
  //       source: '/(.*)',
  //       headers: [
  //         {
  //           key: 'Content-Security-Policy',
  //           value: cspHeader.replace(/\n/g, ''),
  //         },
  //       ],
  //     },
  //   ]
  // },
};

export default nextConfig;