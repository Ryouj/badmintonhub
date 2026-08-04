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

// GetActivity 获取单条活动
func GetActivity(c *gin.Context) {
	openid := c.GetString("openid")
	id := c.Param("id")

	var act models.Activity
	if err := config.DB.Where("id = ? AND open_id = ?", id, openid).First(&act).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "msg": "活动不存在"})
		return
	}

	// 关联账单数量
	var billCount int64
	config.DB.Model(&models.Bill{}).Where("activity_id = ?", act.ID).Count(&billCount)

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"data": models.ActivityWithBills{
			Activity:  act,
			BillCount: billCount,
		},
	})
}

// UpdateActivity 更新活动
func UpdateActivity(c *gin.Context) {
	openid := c.GetString("openid")
	id := c.Param("id")

	var act models.Activity
	if err := config.DB.Where("id = ? AND open_id = ?", id, openid).First(&act).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "msg": "活动不存在"})
		return
	}

	var update models.Activity
	if err := c.ShouldBindJSON(&update); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "msg": "参数错误"})
		return
	}

	config.DB.Model(&act).Updates(map[string]interface{}{
		"date":         update.Date,
		"duration":     update.Duration,
		"location":     update.Location,
		"player_count": update.PlayerCount,
		"note":         update.Note,
	})

	config.DB.Where("id = ?", id).First(&act)
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": act})
}

// DeleteActivity 删除活动
func DeleteActivity(c *gin.Context) {
	openid := c.GetString("openid")
	id := c.Param("id")

	if err := config.DB.Where("id = ? AND open_id = ?", id, openid).Delete(&models.Activity{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "msg": "删除失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "msg": "已删除"})
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
