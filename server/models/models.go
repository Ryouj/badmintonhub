package models

import "time"

// User 用户档案
type User struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	OpenID          string    `gorm:"uniqueIndex;size:64;not null" json:"openid"`
	NickName        string    `gorm:"size:64" json:"nickName"`
	Bio             string    `gorm:"size:256" json:"bio"`
	AvatarURL       string    `gorm:"size:512" json:"avatarUrl"`
	SkillLevel      string    `gorm:"size:32" json:"skillLevel"`
	PlayYears       string    `gorm:"size:16" json:"playYears"`
	PlayFrequency   string    `gorm:"size:16" json:"playFrequency"`
	PlayStyle       string    `gorm:"size:16" json:"playStyle"`
	MainRacket      string    `gorm:"size:128" json:"mainRacket"`
	Shoes           string    `gorm:"size:128" json:"shoes"`
	ShuttleBrand    string    `gorm:"size:128" json:"shuttleBrand"`
	StringTension   int       `json:"stringTension"`
	PreferredVenue  string    `gorm:"size:128" json:"preferredVenue"`
	City            string    `gorm:"size:64" json:"city"`
	PlayType        string    `gorm:"size:64" json:"playType"`
	Hand            string    `gorm:"size:16" json:"hand"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

func (User) TableName() string { return "users" }

// BillSession 记账记录（一次记账可含多笔明细）
type BillSession struct {
	ID            uint       `gorm:"primaryKey" json:"id"`
	OpenID        string     `gorm:"index;size:64;not null" json:"openid"`
	Date          time.Time  `gorm:"index;not null" json:"date"`
	Note          string     `gorm:"size:512" json:"note"`
	ActivityID    uint       `json:"activityId"`
	ActivityLabel string     `gorm:"size:128" json:"activityLabel"`
	TotalAmount   float64    `gorm:"type:decimal(10,2);not null;default:0" json:"totalAmount"`
	ItemCount     int        `gorm:"not null;default:0" json:"itemCount"`
	CreatedAt     time.Time  `json:"createdAt"`
	UpdatedAt     time.Time  `json:"updatedAt"`
	Items         []BillItem `gorm:"foreignKey:SessionID" json:"items,omitempty"`
}

func (BillSession) TableName() string { return "bill_sessions" }

// BillItem 账单明细（每笔明细对应一个消费类别）
type BillItem struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	SessionID uint      `gorm:"index;not null" json:"sessionId"`
	Category  string    `gorm:"size:32;not null" json:"category"`
	Amount    float64   `gorm:"type:decimal(10,2);not null" json:"amount"`
	Note      string    `gorm:"size:256" json:"note"`
	CreatedAt time.Time `json:"createdAt"`
}

func (BillItem) TableName() string { return "bill_items" }

// Bill 保留兼容旧数据的别名（指向 bill_sessions）
type Bill struct {
	ID            uint       `gorm:"primaryKey" json:"id"`
	OpenID        string     `gorm:"index;size:64;not null" json:"openid"`
	Amount        float64    `gorm:"type:decimal(10,2);not null" json:"amount"`
	Category      string     `gorm:"index;size:32;not null" json:"category"`
	Date          time.Time  `gorm:"index;not null" json:"date"`
	Note          string     `gorm:"size:512" json:"note"`
	ActivityID    uint       `json:"activityId"`
	ActivityLabel string     `gorm:"size:128" json:"activityLabel"`
	CreatedAt     time.Time  `json:"createdAt"`
	UpdatedAt     time.Time  `json:"updatedAt"`
	Items         []BillItem `gorm:"-" json:"items,omitempty"`
}

func (Bill) TableName() string { return "bill_sessions" }

// Activity 羽毛球活动
type Activity struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	OpenID      string    `gorm:"index;size:64;not null" json:"openid"`
	Date        time.Time `gorm:"index;not null" json:"date"`
	Duration    int       `gorm:"not null" json:"duration"` // 分钟
	Location    string    `gorm:"size:128" json:"location"`
	PlayerCount int       `gorm:"default:0" json:"playerCount"`
	Note        string    `gorm:"size:512" json:"note"`
	CreatedAt   time.Time `json:"createdAt"`
}

func (Activity) TableName() string { return "activities" }

// --- 请求响应结构 ---

type MonthlyTrend struct {
	Month  string  `json:"month"`
	Amount float64 `json:"amount"`
}

type CategoryBreakdown struct {
	Category string  `json:"category"`
	Amount   float64 `json:"amount"`
}

type StatsSummary struct {
	TotalAmount    float64             `json:"totalAmount"`
	TotalCount     int64               `json:"totalCount"`
	TotalDuration  float64             `json:"totalDuration"`
	MaxDuration    int                 `json:"maxDuration"`
	ActivityCount  int64               `json:"activityCount"`
	CategoryData   []CategoryBreakdown `json:"categoryBreakdown"`
	MonthlyTrend   []MonthlyTrend      `json:"monthlyTrend"`
	TopVenues      []VenueCount        `json:"topVenues"`
}

type VenueCount struct {
	Name  string `json:"name"`
	Count int64  `json:"count"`
}

type CategoryStat struct {
	Key     string  `json:"key"`
	Amount  float64 `json:"amount"`
	Percent float64 `json:"percent"`
}

type LoginReq struct {
	Code      string `json:"code" binding:"required"`
	NickName  string `json:"nickName"`
	AvatarURL string `json:"avatarUrl"`
}

type LoginResp struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type BillListResp struct {
	List        []Bill `json:"list"`
	TotalCount  int64  `json:"totalCount"`
	TotalAmount float64 `json:"totalAmount"`
}

// CreateBillReq 创建账单请求（支持多项目）
type CreateBillReq struct {
	Date          time.Time         `json:"date"`
	Note          string            `json:"note"`
	ActivityID    uint              `json:"activityId"`
	ActivityLabel string            `json:"activityLabel"`
	Items         []CreateBillItem  `json:"items" binding:"required,min=1"`
}

type CreateBillItem struct {
	Category string  `json:"category" binding:"required"`
	Amount   float64 `json:"amount" binding:"required,gt=0"`
}

type ActivityListResp struct {
	List  []ActivityWithBills `json:"list"`
	Total int64               `json:"total"`
}

type ActivityWithBills struct {
	Activity
	BillCount int64 `json:"billCount"`
}
