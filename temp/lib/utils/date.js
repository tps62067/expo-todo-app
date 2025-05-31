"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPastMonthsRange = exports.getPastWeeksRange = exports.getPastDaysRange = exports.getThisMonthRange = exports.getThisWeekRange = exports.getTodayRange = exports.getRelativeCompletionTime = exports.formatCompletionTime = exports.isOverdue = exports.isToday = exports.formatDisplayDate = exports.formatDisplayTime = exports.parseISOString = exports.formatDateTime = exports.getCurrentISOString = void 0;
/**
 * 获取当前时间的ISO字符串
 */
const getCurrentISOString = () => {
    return new Date().toISOString();
};
exports.getCurrentISOString = getCurrentISOString;
/**
 * 格式化日期为YYYY-MM-DD HH:MM:SS格式
 */
const formatDateTime = (date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().slice(0, 19).replace('T', ' ');
};
exports.formatDateTime = formatDateTime;
/**
 * 解析ISO字符串为Date对象
 */
const parseISOString = (isoString) => {
    return new Date(isoString);
};
exports.parseISOString = parseISOString;
/**
 * 格式化显示日期 (如: "今天 14:00", "明天 10:00", "2024-01-15")
 */
const formatDisplayTime = (date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const timeStr = d.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    if (diffDays === 0) {
        return `今天 ${timeStr}`;
    }
    else if (diffDays === 1) {
        return `明天 ${timeStr}`;
    }
    else if (diffDays === -1) {
        return `昨天 ${timeStr}`;
    }
    else {
        return d.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }
};
exports.formatDisplayTime = formatDisplayTime;
/**
 * 格式化显示日期 (如: "2024-01-15")
 */
const formatDisplayDate = (date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};
exports.formatDisplayDate = formatDisplayDate;
/**
 * 检查日期是否为今天
 */
const isToday = (date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    return d.toDateString() === today.toDateString();
};
exports.isToday = isToday;
/**
 * 检查日期是否已过期
 */
const isOverdue = (date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    return d.getTime() < now.getTime();
};
exports.isOverdue = isOverdue;
/**
 * 格式化完成时间显示
 */
const formatCompletionTime = (completedAt) => {
    const d = typeof completedAt === 'string' ? new Date(completedAt) : completedAt;
    return d.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
};
exports.formatCompletionTime = formatCompletionTime;
/**
 * 获取相对完成时间描述
 */
const getRelativeCompletionTime = (completedAt) => {
    const d = typeof completedAt === 'string' ? new Date(completedAt) : completedAt;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMinutes < 1) {
        return '刚刚完成';
    }
    else if (diffMinutes < 60) {
        return `${diffMinutes}分钟前完成`;
    }
    else if (diffHours < 24) {
        return `${diffHours}小时前完成`;
    }
    else if (diffDays < 7) {
        return `${diffDays}天前完成`;
    }
    else if (diffWeeks < 4) {
        return `${diffWeeks}周前完成`;
    }
    else if (diffMonths < 12) {
        return `${diffMonths}个月前完成`;
    }
    else {
        const diffYears = Math.floor(diffMonths / 12);
        return `${diffYears}年前完成`;
    }
};
exports.getRelativeCompletionTime = getRelativeCompletionTime;
/**
 * 获取今天的起止时间
 */
const getTodayRange = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    return { start, end };
};
exports.getTodayRange = getTodayRange;
/**
 * 获取本周的起止时间
 */
const getThisWeekRange = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const diff = currentDay === 0 ? 6 : currentDay - 1; // 周一为一周开始
    const start = new Date(today);
    start.setDate(today.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start, end };
};
exports.getThisWeekRange = getThisWeekRange;
/**
 * 获取本月的起止时间
 */
const getThisMonthRange = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return { start, end };
};
exports.getThisMonthRange = getThisMonthRange;
/**
 * 获取过去N天的起止时间
 */
const getPastDaysRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    start.setHours(0, 0, 0, 0);
    return { start, end };
};
exports.getPastDaysRange = getPastDaysRange;
/**
 * 获取过去N周的起止时间
 */
const getPastWeeksRange = (weeks) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (weeks * 7));
    start.setHours(0, 0, 0, 0);
    return { start, end };
};
exports.getPastWeeksRange = getPastWeeksRange;
/**
 * 获取过去N个月的起止时间
 */
const getPastMonthsRange = (months) => {
    const end = new Date();
    const start = new Date();
    start.setMonth(end.getMonth() - months);
    start.setHours(0, 0, 0, 0);
    return { start, end };
};
exports.getPastMonthsRange = getPastMonthsRange;
