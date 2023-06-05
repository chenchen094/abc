// AdvancedTable.tsx
import { deptTree } from '@/services/system/dept';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { ProFormTreeSelect } from '@ant-design/pro-components';
import {
  Button,
  Card,
  Checkbox,
  Descriptions,
  Form,
  Input,
  message,
  PaginationProps,
  Popconfirm,
  Popover,
  Table,
  Tooltip,
} from 'antd';
import { FormItemProps, Rule } from 'antd/es/form';
import { NamePath } from 'antd/es/form/interface';
import { TableRowSelection } from 'antd/es/table/interface';
import React, { useEffect, useState } from 'react';
import DictOption from '../DictOption';
import TemporaryNoData from '../NoData';
import SelectCard from '../SelectCard';
import WeightCard from '../WeightCard';
import SearchForm from './component/SearchForm';
import styles from './index.less';
interface Column {
  rules?: Rule[] | undefined;
  title?: string;
  dataIndex?: string;
  key?: string;
  editable?: boolean;
  show?: boolean;
  forbidden?: boolean;
  showInTable?: boolean;
  showInDes?: boolean; //查看时是否显示
  skipRenderFilter?: boolean;
  currentCode?: string;
  selectType?: 'multiple'; // multiple 多选 undefined 单选
  optionConfig?: {
    requestData?: (searchParams?: any) => Promise<any>;
    params?: object;
    labelField?: string;
    valueField?: string;
  } | null;
  render?: (value: any, record: any, index: number) => React.ReactNode;
}

interface SearchField {
  label: string;
  name: string;
  placeholder?: string;
  component?: 'Input' | 'Select' | 'DayRange' | any;
  rules?: Rule[];
  optionConfig?: {
    requestData?: (searchParams?: any) => Promise<any>;
    params?: object;
    labelField?: string;
    valueField?: string;
  } | null;
}

interface AdvancedTableProps {
  useTokenRender?: boolean;
  showCard?: boolean;
  showSelectCard?: boolean;
  total?: any;
  showAddButton?: boolean;
  resetCascaderValue?: () => void;
  columns: Column[];
  requestData: (searchParams: Record<string, any>) => Promise<any>;
  searchFields: SearchField[];
  onDelete: (record: any) => void;
  onEdit: (record: any) => Promise<any>;
  onAdd: (record: any) => Promise<any>;
  titleArr?: Array<string>;
  otherAction?: (title: string, record: any) => void;
  customLookAction?: (record: any) => void;
  onDetail: (record: any) => void;
  detailData: any;
  onShowModal?: (record: any) => void;
  onBack?: (record: any) => void;
}
interface AdvancedTableHandles {
  loadData: (params: any) => void; //
  showDescriptions: (record: any) => void;
  showModal: (status: boolean, record: any) => void;
  handleDelete: (params: any) => void;
}
const onChange = (params: any) => {
  return params;
};
const AdvancedTable = React.forwardRef<AdvancedTableHandles, AdvancedTableProps>(
  (
    {
      useTokenRender,
      showCard,
      showSelectCard,
      total,
      showAddButton,
      columns,
      resetCascaderValue,
      requestData,
      searchFields,
      onDelete,
      onEdit,
      onAdd,
      titleArr,
      otherAction,
      customLookAction,
      detailData,
      onDetail,
      onShowModal,
      onBack,
    },
    ref,
  ) => {
    const [data, setData] = useState<any>([]);
    const [loading, setLoading] = useState(false);
    const [showPopover, setShowPopover] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [descriptions, setDescriptions] = useState<any | null>(null);
    let [showPageContainer, setShowPageContainer] = useState<string>('0');
    const [headline, setHeadline] = useState<string>('新增');
    const [form] = Form.useForm();
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [selectedRowKeys, setSelectedRowKeys] = useState<any>([]);
    const [dynamicTotal, setDynamicTotal] = useState(20);
    let [searchParams, setSearchParams] = useState<Record<string, any>>({});

    const [visibleColumns, setVisibleColumns] = useState<string[]>(
      columns.map((column) => column.dataIndex || ''),
    );
    const [formItemEditable, setFormItemEditable] = useState(false);

    const renderFormComponent = (field: any) => {
      switch (field.component) {
        case 'Select':
          return (
            <DictOption
              currentCode={field.currentCode}
              width="100%"
              onChange={onChange}
              selectType={field.selectType}
              optionConfig={field.optionConfig ? field.optionConfig : null}
              dataIndex={field.dataIndex}
              disabled={(formItemEditable && field.editable === false) || field.forbidden}
            ></DictOption>
          );
        case 'deptSelect':
          return (
            <ProFormTreeSelect
              placeholder="请选择部门"
              rules={[{ required: true }]}
              allowClear
              secondary
              request={async () => {
                const res = await deptTree();
                return res.data;
              }}
              fieldProps={{
                labelInValue: true,
                treeNodeFilterProp: 'title',
                fieldNames: {
                  label: 'name',
                  value: 'id',
                },
              }}
            />
          );
        case 'Input':
        default:
          return (
            <Input
              autoComplete="off"
              allowClear
              disabled={(formItemEditable && field.editable === false) || field.forbidden}
            />
          );
      }
    };

    const onSelectChange = (newSelectedRowKeys: any) => {
      console.log('selectedRowKeys changed: ', newSelectedRowKeys);
      setSelectedRowKeys(newSelectedRowKeys);
    };

    const rowSelection: TableRowSelection<any> = {
      selectedRowKeys,
      onChange: onSelectChange,
    };

    const loadData = async ({
      searchParams,
      pageIndex = 1,
      pageSize = 10,
    }: {
      searchParams: any;
      pageIndex?: number;
      pageSize?: number;
    }) => {
      setLoading(true);
      try {
        const fetchedData = await requestData({ ...searchParams, pageIndex, pageSize });
        setData(fetchedData);
        if (pageIndex === 1) {
          setPagination({
            ...pagination,
            total: fetchedData.totalCount,
            current: pageIndex,
            pageSize,
          });
        } else {
          setPagination({
            ...pagination,
            current: pageIndex,
            pageSize,
          });
        }
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      console.log(selectedRowKeys, 'selectedRowKeys');

      // fouterName();
      loadData({ searchParams, pageIndex: 1, pageSize: 10 });
      if (detailData) {
        form.setFieldsValue(detailData);
      }
    }, [showPopover, detailData, form, selectedRowKeys]);

    const showModal = (isAdd: boolean, record?: any) => {
      setShowPageContainer('1');
      if (resetCascaderValue) {
        resetCascaderValue();
      }
      setHeadline('新增');
      setIsAdding(isAdd);
      if (onShowModal) {
        onShowModal(record);
      }
      if (isAdd) {
        setFormItemEditable(false);
        form.resetFields();
      } else {
        setFormItemEditable(true);
        form.setFieldsValue(record);
        if (onDetail) {
          onDetail(record);
        }
        if (detailData) {
          form.setFieldsValue(detailData);
        }
      }
    };
    const showDescriptions = (record: any) => {
      // setIsDescriptions(true);
      setDescriptions(record);
      setShowPageContainer('2');
    };
    const handleDelete = async (record: any) => {
      await onDelete(record);
      loadData({ searchParams, pageIndex: 1, pageSize: 10 });
    };
    React.useImperativeHandle(ref, () => ({
      loadData,
      showDescriptions,
      showModal,
      handleDelete,
    }));
    const pageSizeOptions = ['10', '20', '30', '40'];

    const itemRender: PaginationProps['itemRender'] = (current, type, originalElement) => {
      if (type === 'page') {
        return current;
      }
      if (type === 'prev') {
        return '<';
      }
      if (type === 'next') {
        return '>';
      }
      if (type === 'jump-prev' || type === 'jump-next') {
        return originalElement;
      }
      if (type === 'pageSize') {
        return `${current}/页`;
      }
      return originalElement;
    };
    function tokenRenderPag(current: number, type: string, originalElement: any) {
      if (type === 'prev') {
        return '<';
      }
      if (type === 'next') {
        return originalElement;
      }
      return originalElement;
    }

    // const customPagination = {
    //   current: 1,
    //   pageSize: 1,
    //   total: data.length, // 假设 data 是你的数据数组
    //   itemRender: (current: any, type: string, originalElement: any) => {
    //     if (type === 'prev') {
    //       return <a>上一页</a>;
    //     }
    //     if (type === 'next') {
    //       return <a>下一页</a>;
    //     }
    //     return originalElement;
    //   },
    //   showTotal: (total: any, range: any) => `共 ${total} 条`,
    //   // 更多自定义配置...
    // };
    const formColumns = columns.map((column: any) => {
      if (column.render) {
        return {
          ...column,
          renderFormItem: (
            item: { dataIndex: NamePath | undefined; rules: Rule[] | undefined },
            config: JSX.IntrinsicAttributes & FormItemProps<any>,
          ) => (
            <Form.Item name={item.dataIndex} style={{ height: 0 }} rules={item.rules} {...config}>
              {column.render(formItemEditable)}
            </Form.Item>
          ),
        };
      }
      return column;
    });

    const handleOk = async () => {
      console.log('调用了');
      try {
        const values = await form.validateFields();
        if (isAdding) {
          if (onAdd) {
            try {
              const response = await onAdd(values);
              if (response?.success) {
                setShowPageContainer('0');
                loadData({ searchParams, pageIndex: 1, pageSize: 10 });
                message.success('新增成功');
              }
            } catch (error) {
              console.error(error);
            }
          }
        } else {
          if (onEdit && detailData) {
            try {
              const response = await onEdit({ ...detailData, ...values });
              if (response?.success) {
                setShowPageContainer('0');
                loadData({ searchParams, pageIndex: 1, pageSize: 10 });
                message.success('修改成功');
              }
            } catch (error) {
              console.error(error);
            }
          }
        }
      } catch (error) {
        console.log('表单验证失败:', error);
      }
    };

    const handleTableChange = (pager: any) => {
      loadData({ searchParams, pageIndex: pager.current, pageSize: pager.pageSize });
      setPagination({
        ...pagination,
        // total: data.totalCount,
        total: pagination.total,
        current: pager.current,
        pageSize: pager.pageSize,
      });
    };

    const handleVisibleChange = (visible: boolean) => {
      setShowPopover(visible);
    };

    const handleVisibleColumnsChange = (checkedValues: any) => {
      setVisibleColumns(checkedValues);
    };
    function getActionRender(record: any) {
      let titleArrs: any;
      if (!titleArr) {
        titleArrs = ['查看', '修改', '删除'];
      } else {
        titleArrs = titleArr;
      }
      const buttons = titleArrs.map((title: any, index: any) => {
        if (title === '删除') {
          return (
            <Popconfirm key={index} title="确定要删除吗？" onConfirm={() => handleDelete(record)}>
              <Button type="link" key={index}>
                删除
              </Button>
            </Popconfirm>
          );
        }

        return (
          <Button
            type="link"
            key={index}
            onClick={() => {
              switch (title) {
                case '查看':
                  if (customLookAction) {
                    customLookAction(record);
                  } else {
                    showDescriptions(record);
                  }
                  break;
                case '修改':
                  showModal(false, record);
                  setHeadline('修改');
                  break;
                default:
                  if (otherAction) {
                    otherAction(title, record);
                  }
                  break;
              }
            }}
          >
            {title}
          </Button>
        );
      });

      return buttons;
    }

    const getVisibleColumns = (): Column[] => {
      // 查找操作列
      let actionColumnIndex = columns.findIndex((column) => column.key === 'action');

      let actionColumn = actionColumnIndex >= 0 ? columns[actionColumnIndex] : undefined;

      // 检查操作列是否存在并且有 render 函数，如果没有则使用默认的 getActionRender
      let actionRender =
        actionColumn && actionColumn.render ? actionColumn.render : getActionRender;
      // 如果父组件传入了操作列，使用父组件的 render 函数，如果没有，则使用默认的 getActionRender
      if (actionColumn) {
        actionColumn.render = actionRender;
      } else {
        // 如果父组件没有传入操作列，创建一个
        actionColumn = {
          title: '操作',
          key: 'action',
          render: actionRender,
        };
      }

      // 过滤出可见的列
      const visibleCols = columns.filter(
        (column: Column) =>
          visibleColumns.includes(column.dataIndex as any) && column.key !== 'action',
      );
      // 如果 skipRenderFilter 为 false，保留 render 函数，否则移除
      const visibleColsWithoutRender = visibleCols.map(({ render, skipRenderFilter, ...rest }) => {
        if (skipRenderFilter === false) {
          return { render, ...rest };
        } else {
          return rest;
        }
      });

      visibleColsWithoutRender.push(actionColumn);

      // 过滤出需要在表格中显示的列
      return visibleColsWithoutRender.filter((item) => {
        if (item.showInTable === false) {
          return false;
        } else {
          return true;
        }
      });
    };

    const handleViewButtonClick = () => {
      // 会清空searchForm表单
      loadData({
        searchParams: {},
        pageIndex: 1,
        pageSize: 10,
      });
      setShowPageContainer('0');
    };
    const uniqueAndVisibleColumns: Column[] = columns.filter(
      (column, index, self) =>
        column.showInTable !== false &&
        index === self.findIndex((col) => col.dataIndex === column.dataIndex) &&
        column.dataIndex,
    );

    const options = uniqueAndVisibleColumns.map((column: Column) => ({
      label: column.title,
      value: column.dataIndex,
    }));

    const content = (
      <div style={{ width: '125px' }}>
        <Checkbox.Group
          className={styles.group}
          options={options}
          defaultValue={visibleColumns}
          onChange={handleVisibleColumnsChange}
        />
      </div>
    );

    if (showPageContainer === '0') {
      return (
        <>
          {searchFields.length !== 0 ? (
            <Card style={{ marginBottom: 22 }}>
              <SearchForm
                fields={searchFields}
                onSearch={(params) => {
                  setSearchParams(params);
                  loadData({ searchParams: params });
                }}
              />
              {showCard && <WeightCard total={total}></WeightCard>}
              {showSelectCard && <SelectCard total={total}></SelectCard>}
            </Card>
          ) : null}
          <Card style={{ padding: '0px !important' }}>
            {/* <ReactSVG
            style={{ fontSize: 25, width: 100, height: 100 }}
            src="../../assets/shezhi.svg"
          /> */}
            <span style={{ color: '#303A5E', fontSize: 14, fontWeight: 600 }}>
              {/* {routerNam} */}
            </span>
            <Tooltip placement="top" className={styles.settingOutlined} title={'列设置'}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 18 16.968"
                style={{ marginTop: 6 }}
                onClick={(event) => {
                  // 这里会事件冒泡可能是Table引起的也可能是card先加一个阻止事件冒泡不更新列表data 后面再解决 --- chenjie
                  event.stopPropagation();
                  setShowPopover(true);
                }}
              >
                <defs></defs>
                <g transform="translate(0)">
                  <path
                    className="a"
                    d="M30.362,26.315l-2.641-5.161a2.018,2.018,0,0,0-1.8-1.1H19.911a2.017,2.017,0,0,0-1.789,1.084l-2.7,5.161a2.014,2.014,0,0,0,0,1.867l2.7,5.161a2.018,2.018,0,0,0,1.789,1.084h6.013a2.018,2.018,0,0,0,1.8-1.1l2.641-5.163a2.015,2.015,0,0,0,0-1.836Zm-1.478,7.593a3.325,3.325,0,0,1-2.961,1.81H19.911a3.325,3.325,0,0,1-2.947-1.786l-2.7-5.161a3.319,3.319,0,0,1,0-3.074l2.7-5.163a3.325,3.325,0,0,1,2.947-1.785h6.013a3.327,3.327,0,0,1,2.961,1.81l2.641,5.163a3.318,3.318,0,0,1,0,3.024l-2.641,5.163Z"
                    transform="translate(-13.89 -18.75)"
                  />
                  <path
                    className="a"
                    d="M67.53,71.32a3.785,3.785,0,0,1,0-7.57h0a3.785,3.785,0,0,1,0,7.57Zm0-1.305a2.48,2.48,0,1,0-2.48-2.48A2.48,2.48,0,0,0,67.53,70.015Z"
                    transform="translate(-58.53 -59.051)"
                  />
                </g>
              </svg>

              <Popover
                content={content}
                overlayClassName={styles.popover}
                placement="bottomRight"
                title="显示设置："
                trigger="click"
                open={showPopover}
                onOpenChange={handleVisibleChange}
              ></Popover>
            </Tooltip>
            <Tooltip placement="top" className={styles.redoOutlined}>
              {/* <RedoOutlined
              onClick={() => {
                loadData({ searchParams, pageIndex: 1, pageSize: 10 });
              }}
            /> */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13.475"
                height="16.967"
                viewBox="0 0 13.475 16.967"
              >
                <defs></defs>
                <g transform="translate(-26.099 -13.476)">
                  <path
                    className="a"
                    d="M74.273,43.176V35.2H73.146a.4.4,0,0,1-.282-.681l1.772-1.772a.478.478,0,0,1,.676,0l1.773,1.772a.4.4,0,0,1-.282.681H75.677v7.977H76.8a.4.4,0,0,1,.282.681L75.313,45.63a.478.478,0,0,1-.676,0l-1.772-1.772a.4.4,0,0,1,.282-.681Z"
                    transform="translate(-42.183 -17.298)"
                  />
                  <path
                    className="a"
                    d="M39.323,14.816H27.232a.67.67,0,1,1,0-1.34H39.323a.67.67,0,0,1,0,1.34Z"
                    transform="translate(-0.419)"
                  />
                  <path
                    className="a"
                    d="M38.86,178.072H26.769a.67.67,0,0,1,0-1.34H38.86a.67.67,0,1,1,0,1.34Z"
                    transform="translate(0 -147.629)"
                  />
                </g>
              </svg>
            </Tooltip>
            <Tooltip placement="top" className={styles.redoOutlined} title={'刷新'}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16.997 16.968"
                style={{ marginTop: 3 }}
                onClick={() => {
                  loadData({ searchParams, pageIndex: 1, pageSize: 10 });
                }}
              >
                <defs></defs>
                <path
                  className="a"
                  d="M28.891,15.227a.606.606,0,0,0-.606.606v.853a8.49,8.49,0,1,0-.429,9.244s.008-.01.012-.015c.019-.027.042-.05.061-.077l-.006,0a.6.6,0,0,0,.115-.337.606.606,0,0,0-1.151-.271h0a7.274,7.274,0,1,1,.553-7.575h-.968a.606.606,0,0,0,0,1.212h2.424a.606.606,0,0,0,.606-.606V15.833A.606.606,0,0,0,28.891,15.227Z"
                  transform="translate(-12.5 -12.5)"
                />
              </svg>
            </Tooltip>
            <div className={styles.primaryBtn}>
              {!showAddButton && (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal(true)}>
                  新增
                </Button>
              )}
            </div>
            {onBack ? (
              <Button
                type="primary"
                style={{
                  marginTop: '-5px',
                }}
                onClick={(e) => {
                  onBack(e);
                }}
              >
                返回
              </Button>
            ) : null}
            <Table
              rowKey={(record) => 'table_' + (record.id || record.code || record.uid)}
              columns={getVisibleColumns()}
              locale={{
                emptyText: <TemporaryNoData />,
              }}
              rowSelection={rowSelection}
              size="small"
              dataSource={data.data}
              loading={loading}
              pagination={
                useTokenRender
                  ? {
                      current: pagination.current,
                      total: dynamicTotal,
                      showSizeChanger: false,
                      showQuickJumper: false,
                      onChange: (current, size) => {
                        if (current >= pagination?.current) {
                          console.log('下一页', size);
                          setDynamicTotal((prevTotal) => prevTotal + 10);
                          // 这里会触发2次lodata请求
                          // handleTableChange({ current: current + 1, pageSize: size });
                        } else {
                          console.log('上一页');

                          // handleTableChange({ current: current, pageSize: size });
                        }
                      },
                      itemRender: tokenRenderPag,
                    }
                  : {
                      ...pagination,
                      showTotal: (total: number) => `共 ${total} 条`,
                      showSizeChanger: true,
                      pageSizeOptions: pageSizeOptions,
                      itemRender: itemRender,
                    }
              }
              onChange={handleTableChange}
            />
          </Card>
        </>
      );
    } else if (showPageContainer === '1') {
      return (
        <>
          <Card>
            <CloseOutlined
              style={{ float: 'right', margin: '0px' }}
              onClick={handleViewButtonClick}
            />
            <div
              style={{
                float: 'left',
                margin: '0px',
                color: '#303A5E',
                fontWeight: 500,
                fontSize: 16,
                marginBottom: 40,
              }}
            >
              {headline}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <Form
                form={form}
                layout="vertical"
                autoComplete="on"
                style={{ width: 350 }}
                labelCol={{ span: 7 }}
              >
                {formColumns.map((field) => {
                  return field.show !== false ? (
                    <Form.Item
                      style={{ height: 62 }}
                      key={field.key}
                      label={field.title}
                      name={field.dataIndex}
                      rules={field.rules}
                    >
                      {field.renderFormItem
                        ? field.renderFormItem(field)
                        : renderFormComponent(field)}
                    </Form.Item>
                  ) : null;
                })}
                <Form.Item wrapperCol={{ offset: 0, span: 16 }}>
                  <Button type="primary" onClick={handleOk}>
                    保存
                  </Button>
                  <Button
                    style={{ marginLeft: '10px' }}
                    onClick={() => {
                      form.resetFields(); // 清空表单
                    }}
                  >
                    重置
                  </Button>
                </Form.Item>
              </Form>
            </div>
          </Card>
        </>
      );
    } else if (showPageContainer === '2') {
      return (
        <>
          <Card>
            <CloseOutlined
              style={{ float: 'right', margin: '0px' }}
              onClick={handleViewButtonClick}
            />
            <h3>查看详情</h3>
            <div
              style={{
                width: '100%',
                maxHeight: '210px',
                borderTop: '1px solid #E0E7EC',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                marginBottom: 45,
              }}
            >
              <Descriptions style={{ minHeight: '100px', marginTop: 47 }}>
                {columns.map((field, index) =>
                  field.showInDes !== false ? (
                    <Descriptions.Item
                      className={styles.descriptions_item_min_width}
                      key={field.key}
                      label={field.title}
                      name={field.dataIndex}
                    >
                      <div
                        style={{
                          width: '60ch',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {!field.render &&
                          descriptions &&
                          descriptions[field.dataIndex] &&
                          descriptions[field.dataIndex]}
                        {!field.render && descriptions && !descriptions[field.dataIndex] && '-'}
                        {field.render &&
                          descriptions &&
                          field.render(descriptions[field.dataIndex], null, index)}
                      </div>
                    </Descriptions.Item>
                  ) : null,
                )}
              </Descriptions>
            </div>
          </Card>
        </>
      );
    } else {
      return null;
    }
  },
);
export default AdvancedTable;
