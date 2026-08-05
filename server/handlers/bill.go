package handlers

import (
	"net/http"
	"strconv"
	"time"

	"yuqiuji-server/config"
	"yuqiuji-server/models"

	"github.com/gin-gonic/gin"
)

// 合法类别白名单
var validCategories = map[string]bool{
	"court": true, "shuttle": true, "drink": true,
	"stringing": true, "equipment": true, "other": true,
}

// CreateBill 创建账单
func CreateBill(c *gin.Context) {
	openid := c.GetString("openid")

	var bill models.Bill
	if err := c.ShouldBindJSON(&bill); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "msg": "参数格式错误"})
		return
	}

	// 校验金额
	if bill.Amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "msg": "金额必须大于0"})
		return
	}

	// 校验类别
	if !validCategories[bill.Category] {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "msg": "无效的消费类别"})
		return
	}

	// 校验日期
	if bill.Date.IsZero() {
		bill.Date = time.Now()
	}

	bill.OpenID = openid
	if err := config.DB.Create(&bill).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "msg": "创建失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "data": bill})
}

// GetBill 获取单条账单
func GetBill(c *gin.Context) {
	openid := c.GetString("openid")
	id := c.Param("id")

	var bill models.Bill
	if err := config.DB.Where("id = ? AND open_id = ?", id, openid).First(&bill).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "msg": "账单不存在"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "data": bill})
}

// UpdateBill 更新账单
func UpdateBill(c *gin.Context) {
	openid := c.GetString("openid")
	id := c.Param("id")

	var bill models.Bill
	if err := config.DB.Where("id = ? AND open_id = ?", id, openid).First(&bill).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "msg": "账单不存在"})
		return
	}

	var update models.Bill
	if err := c.ShouldBindJSON(&update); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "msg": "参数格式错误"})
		return
	}

	// 校验金额
	if update.Amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "msg": "金额必须大于0"})
		return
	}

	// 校验类别
	if !validCategories[update.Category] {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "msg": "无效的消费类别"})
		return
	}

	// 校验日期
	if update.Date.IsZero() {
		update.Date = time.Now()
	}

	config.DB.Model(&bill).Updates(map[string]interface{}{
		"amount":         update.Amount,
		"category":       update.Category,
		"date":           update.Date,
		"note":           update.Note,
		"activity_id":    update.ActivityID,
		"activity_label": update.ActivityLabel,
	})

	config.DB.Where("id = ?", id).First(&bill)
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": bill})
}

// DeleteBill 删除账单
func DeleteBill(c *gin.Context) {
	openid := c.GetString("openid")
	id := c.Param("id")

	result := config.DB.Where("id = ? AND open_id = ?", id, openid).Delete(&models.Bill{})
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "msg": "账单不存在"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "msg": "已删除"})
}

// ListBills 账单列表（按月筛选）
func ListBills(c *gin.Context) {
	openid := c.GetString("openid")
	month := c.Query("month") // 2026-08
	pageSizeStr := c.DefaultQuery("pageSize", "50")
	pageSize, _ := strconv.Atoi(pageSizeStr)
	if pageSize <= 0 || pageSize > 200 {
		pageSize = 50
	}

	query := config.DB.Where("open_id = ?", openid)

	if month != "" {
		t, err := time.Parse("2006-01", month)
		if err == nil {
			start := time.Date(t.Year(), t.Month(), 1, 0, 0, 0, 0, t.Location())
			end := start.AddDate(0, 1, 0).Add(-time.Second)
			query = query.Where("date BETWEEN ? AND ?", start, end)
		}
	}

	var totalCount int64
	query.Model(&models.Bill{}).Count(&totalCount)

	// 计算总金额
	var totalAmount float64
	query.Model(&models.Bill{}).Select("COALESCE(SUM(amount), 0)").Scan(&totalAmount)

	var bills []models.Bill
	query.Order("date DESC").Limit(pageSize).Find(&bills)

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"data": models.BillListResp{
			List:        bills,
			TotalCount:  totalCount,
			TotalAmount: totalAmount,
		},
	})
}
