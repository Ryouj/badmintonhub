package handlers

import (
	"net/http"
	"time"

	"yuqiuji-server/config"
	"yuqiuji-server/models"

	"github.com/gin-gonic/gin"
)

// GetSummary 统计汇总
func GetSummary(c *gin.Context) {
	openid := c.GetString("openid")
	period := c.DefaultQuery("period", "month")

	start, _ := getDateRange(period)
	end := time.Now()

	// 1. 从 bill_items 汇总（关联 session 过滤 openid + 时间）
	var totalAmount float64
	var totalCount int64
	config.DB.Table("bill_items").
		Joins("JOIN bill_sessions ON bill_sessions.id = bill_items.session_id").
		Where("bill_sessions.open_id = ? AND bill_sessions.date BETWEEN ? AND ?", openid, start, end).
		Select("COALESCE(SUM(bill_items.amount), 0)").
		Scan(&totalAmount)
	config.DB.Table("bill_items").
		Joins("JOIN bill_sessions ON bill_sessions.id = bill_items.session_id").
		Where("bill_sessions.open_id = ? AND bill_sessions.date BETWEEN ? AND ?", openid, start, end).
		Count(&totalCount)

	// 2. 活动汇总
	var totalDuration float64
	var activityCount int64
	var maxDuration int
	config.DB.Model(&models.Activity{}).
		Where("open_id = ? AND date BETWEEN ? AND ?", openid, start, end).
		Select("COALESCE(SUM(duration), 0)").
		Scan(&totalDuration)
	config.DB.Model(&models.Activity{}).
		Where("open_id = ? AND date BETWEEN ? AND ?", openid, start, end).
		Count(&activityCount)
	config.DB.Model(&models.Activity{}).
		Where("open_id = ? AND date BETWEEN ? AND ?", openid, start, end).
		Select("COALESCE(MAX(duration), 0)").
		Scan(&maxDuration)

	// 3. 类别拆分
	var categoryData []models.CategoryBreakdown
	config.DB.Table("bill_items").
		Joins("JOIN bill_sessions ON bill_sessions.id = bill_items.session_id").
		Where("bill_sessions.open_id = ? AND bill_sessions.date BETWEEN ? AND ?", openid, start, end).
		Select("bill_items.category, SUM(bill_items.amount) as amount").
		Group("bill_items.category").
		Scan(&categoryData)

	// 4. 趋势图（根据 period 调整粒度）
	var trend []models.MonthlyTrend
	now := time.Now()
	switch period {
	case "week":
		for i := 6; i >= 0; i-- {
			d := now.AddDate(0, 0, -i)
			dStart := time.Date(d.Year(), d.Month(), d.Day(), 0, 0, 0, 0, time.Local)
			dEnd := dStart.AddDate(0, 0, 1).Add(-time.Second)
			var sum float64
			config.DB.Table("bill_items").
				Joins("JOIN bill_sessions ON bill_sessions.id = bill_items.session_id").
				Where("bill_sessions.open_id = ? AND bill_sessions.date BETWEEN ? AND ?", openid, dStart, dEnd).
				Select("COALESCE(SUM(bill_items.amount), 0)").Scan(&sum)
			trend = append(trend, models.MonthlyTrend{
				Month:  dStart.Format("1月2日"),
				Amount: sum,
			})
		}
	case "year":
		for i := 11; i >= 0; i-- {
			m := now.AddDate(0, -i, 0)
			mStart := time.Date(m.Year(), m.Month(), 1, 0, 0, 0, 0, time.Local)
			mEnd := mStart.AddDate(0, 1, 0).Add(-time.Second)
			var sum float64
			config.DB.Table("bill_items").
				Joins("JOIN bill_sessions ON bill_sessions.id = bill_items.session_id").
				Where("bill_sessions.open_id = ? AND bill_sessions.date BETWEEN ? AND ?", openid, mStart, mEnd).
				Select("COALESCE(SUM(bill_items.amount), 0)").Scan(&sum)
			trend = append(trend, models.MonthlyTrend{
				Month:  mStart.Format("1月"),
				Amount: sum,
			})
		}
	default:
		for i := 11; i >= 0; i-- {
			m := now.AddDate(0, -i, 0)
			mStart := time.Date(m.Year(), m.Month(), 1, 0, 0, 0, 0, time.Local)
			mEnd := mStart.AddDate(0, 1, 0).Add(-time.Second)
			var sum float64
			config.DB.Table("bill_items").
				Joins("JOIN bill_sessions ON bill_sessions.id = bill_items.session_id").
				Where("bill_sessions.open_id = ? AND bill_sessions.date BETWEEN ? AND ?", openid, mStart, mEnd).
				Select("COALESCE(SUM(bill_items.amount), 0)").Scan(&sum)
			trend = append(trend, models.MonthlyTrend{
				Month:  mStart.Format("1月"),
				Amount: sum,
			})
		}
	}

	// 5. 球馆排行
	var topVenues []models.VenueCount
	config.DB.Model(&models.Activity{}).
		Where("open_id = ? AND location != '' AND date BETWEEN ? AND ?", openid, start, end).
		Select("location as name, COUNT(*) as count").
		Group("location").
		Order("count DESC").
		Limit(5).
		Scan(&topVenues)

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"data": models.StatsSummary{
			TotalAmount:   totalAmount,
			TotalCount:    totalCount,
			TotalDuration: totalDuration / 60,
			MaxDuration:   maxDuration,
			ActivityCount: activityCount,
			CategoryData:  categoryData,
			MonthlyTrend:  trend,
			TopVenues:     topVenues,
		},
	})
}

func getDateRange(period string) (time.Time, time.Time) {
	now := time.Now()
	var start time.Time

	switch period {
	case "week":
		weekday := now.Weekday()
		if weekday == 0 {
			weekday = 7
		}
		start = now.AddDate(0, 0, -int(weekday)+1)
		start = time.Date(start.Year(), start.Month(), start.Day(), 0, 0, 0, 0, time.Local)
	case "month":
		start = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.Local)
	case "year":
		start = time.Date(now.Year(), 1, 1, 0, 0, 0, 0, time.Local)
	default:
		start = time.Date(2020, 1, 1, 0, 0, 0, 0, time.Local)
	}

	return start, now
}
