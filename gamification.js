const Achievement = require('../models/Achievement');

async function ensureBadge(user, badgeType, meta = {}) {
  const has = user.badges.some((b) => b.type === badgeType);
  if (has) return;
  user.badges.push({ type: badgeType, earnedAt: new Date() });
  try {
    await Achievement.findOneAndUpdate(
      { userId: user._id, badgeType },
      { userId: user._id, badgeType, progress: 100, unlockedAt: new Date(), meta },
      { upsert: true }
    );
  } catch (e) {
    /* ignore duplicate */
  }
}

async function onAppValidated(user, trustScore) {
  if (trustScore >= 90) {
    user.highTrustAppCount = (user.highTrustAppCount || 0) + 1;
    if (user.highTrustAppCount >= 5) await ensureBadge(user, 'logic_master', { count: user.highTrustAppCount });
  }
  user.xp = (user.xp || 0) + Math.round(trustScore / 2);
}

async function onAppGenerated(user) {
  const now = new Date();
  user.generationTimestamps = [...(user.generationTimestamps || []), now].slice(-30);
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const recent = user.generationTimestamps.filter((t) => t > hourAgo);
  if (recent.length >= 10) await ensureBadge(user, 'speedy_creator', { count: recent.length });
}

async function onAppDeployed(user) {
  user.deployCount = (user.deployCount || 0) + 1;
  if (user.deployCount === 1) await ensureBadge(user, 'first_deploy');
  if (user.deployCount >= 15 && (user.highTrustAppCount || 0) >= 3) await ensureBadge(user, 'innovator');
  user.xp = (user.xp || 0) + 120;
}

module.exports = { ensureBadge, onAppValidated, onAppGenerated, onAppDeployed };
