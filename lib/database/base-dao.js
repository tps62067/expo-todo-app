"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseDAO = void 0;
const date_1 = require("../utils/date");
const uuid_1 = require("../utils/uuid");
const manager_1 = __importDefault(require("./manager"));
/**
 * 数据访问对象基类
 * 提供通用的CRUD操作
 */
class BaseDAO {
    constructor(tableName) {
        this.dbManager = manager_1.default.getInstance();
        this.tableName = tableName;
    }
    /**
     * 创建新记录
     */
    async create(data) {
        const now = (0, date_1.getCurrentISOString)();
        const entity = {
            ...data,
            id: (0, uuid_1.generateUUID)(),
            created_at: now,
            updated_at: now,
            sync_status: 1, // 待同步
            local_version: 1,
            is_deleted_locally: 0,
        };
        // 过滤掉undefined值，只包含有效字段
        const validFields = [];
        const validValues = [];
        for (const [key, value] of Object.entries(entity)) {
            if (value !== undefined) {
                validFields.push(key);
                validValues.push(value);
            }
        }
        const placeholders = validFields.map(() => '?').join(', ');
        const sql = `INSERT INTO ${this.tableName} (${validFields.join(', ')}) VALUES (${placeholders})`;
        console.log('[BaseDAO] 创建记录SQL:', sql);
        console.log('[BaseDAO] 创建记录数据:', validValues);
        await this.dbManager.runAsync(sql, validValues);
        return entity;
    }
    /**
     * 根据ID查找记录
     */
    async findById(id) {
        const sql = `SELECT * FROM ${this.tableName} WHERE id = ? AND is_deleted_locally = 0`;
        return await this.dbManager.getFirstAsync(sql, [id]);
    }
    /**
     * 查找所有记录
     */
    async findAll(orderBy) {
        let sql = `SELECT * FROM ${this.tableName} WHERE is_deleted_locally = 0`;
        if (orderBy) {
            sql += ` ORDER BY ${orderBy}`;
        }
        return await this.dbManager.getAllAsync(sql);
    }
    /**
     * 根据条件查找记录
     */
    async findWhere(conditions, orderBy) {
        const whereClause = Object.keys(conditions)
            .map(key => `${key} = ?`)
            .join(' AND ');
        let sql = `SELECT * FROM ${this.tableName} WHERE ${whereClause} AND is_deleted_locally = 0`;
        if (orderBy) {
            sql += ` ORDER BY ${orderBy}`;
        }
        const values = Object.values(conditions);
        return await this.dbManager.getAllAsync(sql, values);
    }
    /**
     * 根据条件查找单条记录
     */
    async findOneWhere(conditions) {
        const whereClause = Object.keys(conditions)
            .map(key => `${key} = ?`)
            .join(' AND ');
        const sql = `SELECT * FROM ${this.tableName} WHERE ${whereClause} AND is_deleted_locally = 0 LIMIT 1`;
        const values = Object.values(conditions);
        return await this.dbManager.getFirstAsync(sql, values);
    }
    /**
     * 更新记录
     */
    async update(id, data) {
        const updateData = {
            ...data,
            updated_at: (0, date_1.getCurrentISOString)(),
            local_version: await this.getNextVersion(id),
            sync_status: 1, // 待同步
        };
        const fields = Object.keys(updateData);
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = [...Object.values(updateData), id];
        const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
        const result = await this.dbManager.runAsync(sql, values);
        if (result.changes > 0) {
            return await this.findById(id);
        }
        return null;
    }
    /**
     * 软删除记录
     */
    async softDelete(id) {
        const sql = `UPDATE ${this.tableName} SET is_deleted_locally = 1, updated_at = ?, sync_status = 1 WHERE id = ?`;
        const result = await this.dbManager.runAsync(sql, [(0, date_1.getCurrentISOString)(), id]);
        // 在Web环境下，result.changes可能不可靠，增加一次查询验证
        if (result.changes > 0) {
            return true;
        }
        // 如果影响行数为0，或者在Web环境下，再次查询确认
        // (考虑到Web环境的 SQLite Polyfill 可能有不同行为)
        const verificationSql = `SELECT is_deleted_locally FROM ${this.tableName} WHERE id = ?`;
        const verificationResult = await this.dbManager.getFirstAsync(verificationSql, [id]);
        return verificationResult?.is_deleted_locally === 1;
    }
    /**
     * 硬删除记录
     */
    async hardDelete(id) {
        const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
        const result = await this.dbManager.runAsync(sql, [id]);
        return result.changes > 0;
    }
    /**
     * 获取记录总数
     */
    async count(conditions) {
        let sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE is_deleted_locally = 0`;
        const values = [];
        if (conditions) {
            const whereClause = Object.keys(conditions)
                .map(key => `${key} = ?`)
                .join(' AND ');
            sql += ` AND ${whereClause}`;
            values.push(...Object.values(conditions));
        }
        const result = await this.dbManager.getFirstAsync(sql, values);
        return result?.count || 0;
    }
    /**
     * 检查记录是否存在
     */
    async exists(id) {
        const sql = `SELECT 1 FROM ${this.tableName} WHERE id = ? AND is_deleted_locally = 0 LIMIT 1`;
        const result = await this.dbManager.getFirstAsync(sql, [id]);
        return result !== null;
    }
    /**
     * 批量创建记录
     */
    async createBatch(dataList) {
        return await this.dbManager.withTransaction(async () => {
            const results = [];
            for (const data of dataList) {
                const entity = await this.create(data);
                results.push(entity);
            }
            return results;
        });
    }
    /**
     * 批量更新记录
     */
    async updateBatch(updates) {
        return await this.dbManager.withTransaction(async () => {
            const results = [];
            for (const { id, data } of updates) {
                const entity = await this.update(id, data);
                if (entity) {
                    results.push(entity);
                }
            }
            return results;
        });
    }
    /**
     * 获取下一个版本号
     */
    async getNextVersion(id) {
        const sql = `SELECT local_version FROM ${this.tableName} WHERE id = ?`;
        const result = await this.dbManager.getFirstAsync(sql, [id]);
        return (result?.local_version || 0) + 1;
    }
    /**
     * 更新同步状态
     */
    async updateSyncStatus(id, syncStatus, remoteVersionToken) {
        const updateData = {
            sync_status: syncStatus,
            last_synced_at: (0, date_1.getCurrentISOString)(),
        };
        if (remoteVersionToken) {
            updateData.remote_version_token = remoteVersionToken;
        }
        const fields = Object.keys(updateData);
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = [...Object.values(updateData), id];
        const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
        const result = await this.dbManager.runAsync(sql, values);
        return result.changes > 0;
    }
    /**
     * 获取待同步的记录
     */
    async getPendingSyncItems() {
        const sql = `SELECT * FROM ${this.tableName} WHERE sync_status IN (1, 4, 5) ORDER BY updated_at ASC`;
        return await this.dbManager.getAllAsync(sql);
    }
}
exports.BaseDAO = BaseDAO;
