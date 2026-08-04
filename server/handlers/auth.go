package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"

	"yuqiuji-server/config"
	"yuqiuji-server/middleware"
	"yuqiuji-server/models"

	"github.com/gin-gonic/gin"
)

// Login 微信登录
func Login(c *gin.Context) {
	var req models.LoginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "msg": "参数错误"})
		return
	}

	// 调用微信接口换取 openid
	openid, err := code2Session(req.Code)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "msg": "登录失败: " + err.Error()})
		return
	}

	// 查找或创建用户
	var user models.User
	result := config.DB.Where("open_id = ?", openid).First(&user)
	if result.Error != nil {
		user = models.User{OpenID: openid}
		config.DB.Create(&user)
	}

	// 生成 JWT
	token, err := middleware.GenerateToken(openid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "msg": "Token 生成失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"data": models.LoginResp{
			Token: token,
			User:  user,
		},
	})
}

func code2Session(code string) (string, error) {
	apiURL := fmt.Sprintf("https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code",
		config.AppConfig.AppID, config.AppConfig.AppSecret, url.QueryEscape(code))

	resp, err := http.Get(apiURL)
	if err != nil {
		return "", fmt.Errorf("请求微信接口失败")
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var result struct {
		OpenID     string `json:"openid"`
		SessionKey string `json:"session_key"`
		ErrCode    int    `json:"errcode"`
		ErrMsg     string `json:"errmsg"`
	}
	json.Unmarshal(body, &result)

	if result.ErrCode != 0 {
		return "", fmt.Errorf(result.ErrMsg)
	}
	return result.OpenID, nil
}
