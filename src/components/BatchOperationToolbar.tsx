import { COLORS } from '@/constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface BatchOperationToolbarProps {
  selectedCount: number;
  totalCount: number;
  isAllSelected: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onClearSelection: () => void;
  onDeleteAll: () => Promise<void>;
  onRestoreAll: () => Promise<void>;
  onExportAll: () => Promise<any>;
}

const { width: screenWidth } = Dimensions.get('window');

export const BatchOperationToolbar = memo<BatchOperationToolbarProps>(({
  selectedCount,
  totalCount,
  isAllSelected,
  onSelectAll,
  onDeselectAll,
  onClearSelection,
  onDeleteAll,
  onRestoreAll,
  onExportAll,
}) => {
  const handleSelectAllToggle = useCallback(() => {
    if (selectedCount === totalCount && totalCount > 0) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  }, [selectedCount, totalCount, onSelectAll, onDeselectAll]);

  const selectionProgress = useMemo(() => {
    return totalCount > 0 ? selectedCount / totalCount : 0;
  }, [selectedCount, totalCount]);

  const canPerformActions = selectedCount > 0;

  const getSelectionText = useCallback(() => {
    if (selectedCount === 0) return '未选择项目';
    if (selectedCount === totalCount) return `已全选 ${totalCount} 项`;
    return `已选择 ${selectedCount} / ${totalCount} 项`;
  }, [selectedCount, totalCount]);

  return (
    <View style={styles.container}>
      <View style={styles.selectionSection}>
        <TouchableOpacity 
          style={styles.selectAllContainer}
          onPress={handleSelectAllToggle}
          activeOpacity={0.7}
        >
          <View style={[
            styles.checkboxContainer,
            selectedCount === totalCount && totalCount > 0 && styles.checkboxSelected,
            selectedCount > 0 && selectedCount < totalCount && styles.checkboxIndeterminate
          ]}>
            <MaterialCommunityIcons 
              name={
                selectedCount === totalCount && totalCount > 0 
                  ? "check" 
                  : selectedCount > 0 
                    ? "minus" 
                    : "plus"
              } 
              size={16} 
              color={
                selectedCount > 0 
                  ? COLORS.white 
                  : COLORS.gray400
              } 
            />
          </View>
          <View style={styles.selectAllTextContainer}>
            <Text style={styles.selectAllText}>
              {selectedCount === totalCount && totalCount > 0 ? '取消全选' : '全选'}
            </Text>
            <Text style={styles.selectionStatus}>
              {getSelectionText()}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill,
                { 
                  width: `${selectionProgress * 100}%`,
                  backgroundColor: selectionProgress === 1 ? COLORS.success : COLORS.primary
                }
              ]} 
            />
          </View>
        </View>
      </View>
      
      <View style={styles.actionsSection}>
        <View style={styles.primaryActions}>
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              styles.restoreButton,
              !canPerformActions && styles.disabledButton
            ]}
            onPress={onRestoreAll}
            disabled={!canPerformActions}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons 
              name="restore" 
              size={18} 
              color={canPerformActions ? COLORS.white : COLORS.gray400} 
            />
            <Text style={[
              styles.actionButtonText,
              !canPerformActions && styles.disabledText
            ]}>
              恢复
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              styles.exportButton,
              !canPerformActions && styles.disabledButton
            ]}
            onPress={onExportAll}
            disabled={!canPerformActions}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons 
              name="download" 
              size={18} 
              color={canPerformActions ? COLORS.white : COLORS.gray400} 
            />
            <Text style={[
              styles.actionButtonText,
              !canPerformActions && styles.disabledText
            ]}>
              导出
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              styles.deleteButton,
              !canPerformActions && styles.disabledButton
            ]}
            onPress={onDeleteAll}
            disabled={!canPerformActions}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons 
              name="delete-outline" 
              size={18} 
              color={canPerformActions ? COLORS.white : COLORS.gray400} 
            />
            <Text style={[
              styles.actionButtonText,
              !canPerformActions && styles.disabledText
            ]}>
              删除
            </Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={onClearSelection}
          activeOpacity={0.6}
        >
          <MaterialCommunityIcons name="close" size={20} color={COLORS.gray600} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

BatchOperationToolbar.displayName = 'BatchOperationToolbar';

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  selectionSection: {
    marginBottom: 16,
  },
  selectAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.gray300,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxIndeterminate: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  selectAllTextContainer: {
    flex: 1,
  },
  selectAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textColor,
    marginBottom: 2,
  },
  selectionStatus: {
    fontSize: 14,
    color: COLORS.gray500,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.gray100,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  actionsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryActions: {
    flexDirection: 'row',
    flex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 12,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  restoreButton: {
    backgroundColor: COLORS.warning,
  },
  exportButton: {
    backgroundColor: COLORS.primary,
  },
  deleteButton: {
    backgroundColor: COLORS.danger,
  },
  disabledButton: {
    backgroundColor: COLORS.gray200,
    shadowOpacity: 0,
    elevation: 0,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 6,
  },
  disabledText: {
    color: COLORS.gray400,
  },
  cancelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});

export default BatchOperationToolbar; 