package handlers

import (
	"net/http"
	"strconv"
	"time"

	"yuqiuji-server/config"
	"yuqiuji-server/models"

	"github.com/gin-gonic/gin"
)

var validCategories = map[string]bool{
	"court": true, "shuttle": true, "drink": true, "transport": true,
	"stringing": true, "equipment": true, "other": true,
}

// CreateBill 创建记账记录（支持多项目）
func CreateBill(c *gin.Context) {
	openid := c.GetString("openid")

	var req models.CreateBillReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "msg": "参数格式错误：至少需要一个项目"})
		return
	}

	if req.Date.IsZero() {
		req.Date = time.Now()
	}

	// 计算总额
	var total float64
	var items []models.BillItem
	for _, it := range req.Items {
		if it.Amount <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"code": 400, "msg": "金额必须大于0"})
			return
		}
		if !validCategories[it.Category] {
			c.JSON(http.StatusBadRequest, gin.H{"code": 400, "msg": "无效的消费类别: " + it.Category})
			return
		}
		total += it.Amount
		items = append(items, models.BillItem{
			Category: it.Category,
			Amount:   it.Amount,
		})
	}

	session := models.BillSession{
		OpenID:        openid,
		Date:          req.Date,
		Note:          req.Note,
		ActivityID:    req.ActivityID,
		ActivityLabel: req.ActivityLabel,
		TotalAmount:   total,
		ItemCount:     len(items),
		Items:         items,
	}

	if err := config.DB.Create(&session).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "msg": "创建失败"})
		return
	}

	// 重新查询带 items
	config.DB.Preload("Items").First(&session, session.ID)
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": toBillResp(session)})
}

// GetBill 获取单条记账记录
func GetBill(c *gin.Context) {
	openid := c.GetString("openid")
	id := c.Param("id")

	var session models.BillSession
	if err := config.DB.Preload("Items").
		Where("id = ? AND open_id = ?", id, openid).
		First(&session).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "msg": "记录不存在"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "data": toBillResp(session)})
}

// UpdateBill 更新记账记录
func UpdateBill(c *gin.Context) {
	openid := c.GetString("openid")
	id := c.Param("id")

	var session models.BillSession
	if err := config.DB.Where("id = ? AND open_id = ?", id, openid).First(&session).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "msg": "记录不存在"})
		return
	}

	var req models.CreateBillReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "msg": "参数格式错误"})
		return
	}

	if req.Date.IsZero() {
		req.Date = session.Date
	}

	// 重新计算
	var total float64
	var items []models.BillItem
	for _, it := range req.Items {
		if it.Amount <= 0 || !validCategories[it.Category] {
			c.JSON(http.StatusBadRequest, gin.H{"code": 400, "msg": "项目数据无效"})
			return
		}
		total += it.Amount
		items = append(items, models.BillItem{
			SessionID: session.ID,
			Category:  it.Category,
			Amount:    it.Amount,
		})
	}

	// 事务：删旧明细 + 更新 session + 插新明细
	tx := config.DB.Begin()
	tx.Where("session_id = ?", session.ID).Delete(&models.BillItem{})
	tx.Model(&session).Updates(map[string]interface{}{
		"date":           req.Date,
		"note":           req.Note,
		"activity_id":    req.ActivityID,
		"activity_label": req.ActivityLabel,
		"total_amount":   total,
		"item_count":     len(items),
	})
	for i := range items {
		items[i].SessionID = session.ID
	}
	tx.Create(&items)
	tx.Commit()

	config.DB.Preload("Items").First(&session, session.ID)
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": toBillResp(session)})
}

// DeleteBill 删除记账记录
func DeleteBill(c *gin.Context) {
	openid := c.GetString("openid")
	id := c.Param("id")

	var session models.BillSession
	if err := config.DB.Where("id = ? AND open_id = ?", id, openid).First(&session).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "msg": "记录不存在"})
		return
	}

	tx := config.DB.Begin()
	tx.Where("session_id = ?", id).Delete(&models.BillItem{})
	tx.Where("id = ?", id).Delete(&models.BillSession{})
	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"code": 0, "msg": "已删除"})
}

// ListBills 记账记录列表
func ListBills(c *gin.Context) {
	openid := c.GetString("openid")
	month := c.Query("month")
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
	query.Model(&models.BillSession{}).Count(&totalCount)

	var totalAmount float64
	query.Model(&models.BillSession{}).Select("COALESCE(SUM(total_amount), 0)").Scan(&totalAmount)

	var sessions []models.BillSession
	query.Preload("Items").Order("date DESC").Limit(pageSize).Find(&sessions)

	var bills []models.Bill
	for _, s := range sessions {
		bills = append(bills, toBillResp(s))
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"data": models.BillListResp{
			List:        bills,
			TotalCount:  totalCount,
			TotalAmount: totalAmount,
		},
	})
}

// toBillResp 将 BillSession 转为 Bill 响应格式（兼容前端）
func toBillResp(s models.BillSession) models.Bill {
	return models.Bill{
		ID:            s.ID,
		OpenID:        s.OpenID,
		Amount:        s.TotalAmount,
		Category:      firstCategory(s.Items),
		Date:          s.Date,
		Note:          s.Note,
		ActivityID:    s.ActivityID,
		ActivityLabel: s.ActivityLabel,
		CreatedAt:     s.CreatedAt,
		UpdatedAt:     s.UpdatedAt,
		Items:         s.Items,
	}
}

func firstCategory(items []models.BillItem) string {
	if len(items) > 0 {
		return items[0].Category
	}
	return ""
}
