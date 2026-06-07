const ReadingHistory = require("../models/ReadingHistory");
const SavedNews = require("../models/SavedNews");

// ─── GET /api/analytics/summary ───────────────────────────────────────────────
// Returns all analytics data in one request to minimize round trips
exports.getSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // ── Date boundaries ──────────────────────────────
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay()); // Sunday
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // ── 1. Weekly bar chart (last 7 days) ─────────────
    const weeklyRaw = await ReadingHistory.aggregate([
      {
        $match: {
          userId,
          readAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$readAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Build full 7-day array (fill missing days with 0)
    const weeklyMap = {};
    weeklyRaw.forEach((d) => (weeklyMap[d._id] = d.count));
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
      });
      weeklyData.push({ date: key, label, count: weeklyMap[key] || 0 });
    }

    // ── 2. Category breakdown (last 30 days) ──────────
    const categoryRaw = await ReadingHistory.aggregate([
      { $match: { userId, readAt: { $gte: last30Days } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    const categoryData = categoryRaw.map((c) => ({
      category: c._id || "general",
      count: c.count,
    }));

    // ── 3. Reading streak ──────────────────────────────
    const allDays = await ReadingHistory.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$readAt" },
          },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    const daySet = new Set(allDays.map((d) => d._id));
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let checkDate = new Date(startOfToday);

    // Current streak - count backwards from today
    while (true) {
      const key = checkDate.toISOString().split("T")[0];
      if (daySet.has(key)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Longest streak - iterate all days sorted descending
    const sortedDays = [...daySet].sort().reverse();
    let prev = null;
    for (const day of sortedDays) {
      if (!prev) {
        tempStreak = 1;
      } else {
        const diff = (new Date(prev) - new Date(day)) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
      prev = day;
    }

    // ── 4. Total reads this month ──────────────────────
    const totalThisMonth = await ReadingHistory.countDocuments({
      userId,
      readAt: { $gte: startOfMonth },
    });

    // ── 5. Total reads all time ────────────────────────
    const totalAllTime = await ReadingHistory.countDocuments({ userId });

    // ── 6. Most saved category ─────────────────────────
    const savedByCategory = await SavedNews.aggregate([
      { $match: { userId } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // ── 7. Today's reads ───────────────────────────────
    const todayCount = await ReadingHistory.countDocuments({
      userId,
      readAt: { $gte: startOfToday },
    });

    res.status(200).json({
      success: true,
      data: {
        weeklyData,
        categoryData,
        streak: {
          current: currentStreak,
          longest: longestStreak,
        },
        totals: {
          today: todayCount,
          thisMonth: totalThisMonth,
          allTime: totalAllTime,
        },
        savedByCategory,
      },
    });
  } catch (error) {
    console.error("[Analytics] Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
      error: error.message,
    });
  }
};
