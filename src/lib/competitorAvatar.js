export function competitorAvatarUrl(competitor, size = 256) {
  if (competitor?.profile_image_url) {
    return competitor.profile_image_url;
  }

  const name = encodeURIComponent(competitor?.full_name ?? 'Competitor');
  return `https://ui-avatars.com/api/?name=${name}&background=16a34a&color=fff&size=${size}`;
}
