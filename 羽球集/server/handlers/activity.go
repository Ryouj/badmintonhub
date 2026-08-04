package handlers

import (
	"net/http"
	"strconv"

	"yuqiuji-server/config"
	"yuqiuji-server/models"

	"github.com/gin-gonic/gin"
)

// CreateActivity 创建活动
func CreateActivity(c *gin.Context) {
	openid := c.GetString("openid")

	var act models.Activity
	if err := c.ShouldBindJSON(&act); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "msg": "参数错误"})
		return
	}

	act.OpenID = openid
	if err := config.DB.Create(&act).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "msg": "创建失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "data": act})
}

// ListActivities 活动列表
func ListActivities(c *gin.Context) {
	openid := c.GetString("openid")
	pageSizeStr := c.DefaultQuery("pageSize", "20")
	pageSize, _ := strconv.Atoi(pageSizeStr)

	var total int64
	config.DB.Model(&models.Activity{}).Where("open_id = ?", openid).Count(&total)

	var activities []models.Activity
	config.DB.Where("open_id = ?", openid).
		Order("date DESC").
		Limit(pageSize).
		Find(&activities)

	// 关联账单数量
	var result []models.ActivityWithBills
	for _, a := range activities {
		var count int64
		config.DB.Model(&models.Bill{}).Where("activity_id = ?", a.ID).Count(&count)
		result = append(result, models.ActivityWithBills{
			Activity:  a,
			BillCount: count,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"data": models.ActivityListResp{
			List:  result,
			Total: total,
		},
	})
}
