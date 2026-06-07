/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/transport-issue-helper",
        destination: "/transport-tools/issue-helper",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
