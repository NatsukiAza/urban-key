import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['react-quill', '@fullcalendar/react', 'mantine-datatable', 'react-apexcharts'],
};

export default nextConfig;
