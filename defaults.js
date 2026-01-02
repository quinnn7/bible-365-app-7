// Shared defaults used across the app
export const DEFAULT_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'>
  <rect width='100%' height='100%' fill='%23FFFFFF' />
  <text x='50%' y='50%' font-size='64' text-anchor='middle' dominant-baseline='central'>👤</text>
</svg>
`)}`;

export default {
  DEFAULT_AVATAR,
};
