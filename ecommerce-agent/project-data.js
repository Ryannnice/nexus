/* Generated from /renyuanliu/Agent/PROJECT artifacts through 2026-08-08. */
window.PROJECT_DATA = {
  "snapshot": {
    "date": "2026-08-08",
    "label": "INTEGRATED SYSTEM SNAPSHOT",
    "catalogVersion": "2026-07-06",
    "scope": "固定 100 个工具范围内的意图分流、候选检索与有序工具链离线测试",
    "repository": "https://github.com/Ryannnice/Agent"
  },
  "heroTraces": [
    {
      "id": "single_test_048_000",
      "label": "物流查询",
      "query": "帮我看看这款台灯的包裹送到哪了。",
      "gold": [
        "get_order_logistics"
      ],
      "prediction": [
        "get_order_logistics",
        "query_delivery_fee",
        "get_notification_preferences",
        "estimate_delivery_time",
        "get_lost_package_process",
        "get_warehouse_stock_region",
        "confirm_order_receipt",
        "split_shipment_plan",
        "create_aftersale_ticket",
        "get_delivery_options"
      ]
    },
    {
      "id": "multi_test_01175",
      "label": "库存与商品查询",
      "query": "查看南京地区净水器的仓库余量、商品核心信息和本地 SKU 库存。",
      "gold": [
        "get_warehouse_stock_region",
        "get_item_info",
        "get_sku_stock"
      ],
      "prediction": [
        "get_warehouse_stock_region",
        "get_sku_stock",
        "split_shipment_plan",
        "get_checkout_preview",
        "get_user_addresses",
        "get_item_info",
        "estimate_delivery_time",
        "get_cart_summary",
        "can_merge_ship",
        "get_order_logistics"
      ]
    },
    {
      "id": "multi_test_02965",
      "label": "售后与退款处理",
      "query": "查看防晒霜售后处理进度和退款到账状态，并为破损商品创建售后单。",
      "gold": [
        "get_aftersale_ticket_status",
        "get_refund_status",
        "create_aftersale_ticket"
      ],
      "prediction": [
        "create_aftersale_ticket",
        "get_refund_status",
        "get_aftersale_ticket_status",
        "create_manual_service_ticket",
        "create_repair_ticket",
        "get_order_payment_status",
        "upload_aftersale_evidence",
        "get_quality_issue_policy",
        "request_reship_missing_item",
        "confirm_order_receipt"
      ]
    },
    {
      "id": "multi_test_01024",
      "label": "商品决策",
      "query": "查看床垫质量争议处理规则、买家评价和评价风险摘要，再比较更省钱的购买渠道。",
      "gold": [
        "get_quality_issue_policy",
        "get_item_reviews",
        "compare_item_price",
        "summarize_item_reviews"
      ],
      "prediction": [
        "get_item_reviews",
        "get_quality_issue_policy",
        "summarize_item_reviews",
        "get_price_history",
        "check_item_authenticity",
        "get_refund_status",
        "get_complaint_channels",
        "get_aftersale_ticket_status",
        "confirm_order_receipt",
        "get_item_qa"
      ]
    },
    {
      "id": "multi_test_01817",
      "label": "优惠组合",
      "query": "查看可用优惠券和当前促销，计算预计到手价，并比较不同促销方案。",
      "gold": [
        "get_available_coupons",
        "get_current_promotions",
        "calc_discount",
        "compare_promotion_options"
      ],
      "prediction": [
        "get_current_promotions",
        "compare_promotion_options",
        "get_available_coupons",
        "calc_discount",
        "get_member_level",
        "get_user_profile",
        "get_flash_sale_status",
        "apply_coupon",
        "confirm_order_receipt",
        "compare_item_price"
      ]
    },
    {
      "id": "multi_test_00023",
      "label": "支付处理",
      "query": "查询订单支付状态和可用支付方式，核验扣款异常，并在支付失败时重新发起支付。",
      "gold": [
        "get_order_payment_status",
        "get_payment_methods",
        "verify_payment_risk",
        "create_payment_retry"
      ],
      "prediction": [
        "get_order_payment_status",
        "verify_payment_risk",
        "create_payment_retry",
        "get_payment_methods",
        "get_order_detail",
        "check_account_risk",
        "get_order_afterpay_status",
        "generate_risk_notice",
        "confirm_order_receipt",
        "detect_abnormal_order"
      ]
    },
    {
      "id": "multi_test_00003",
      "label": "购物车管理",
      "query": "汇总购物车，清理失效商品，把暂不购买的商品移入以后再买，并调整购买数量。",
      "gold": [
        "get_cart_summary",
        "remove_cart_item",
        "save_item_for_later",
        "update_cart_quantity"
      ],
      "prediction": [
        "remove_cart_item",
        "get_cart_summary",
        "update_cart_quantity",
        "save_item_for_later",
        "create_cart_item",
        "submit_order",
        "update_default_address",
        "validate_checkout_items",
        "get_user_addresses",
        "get_checkout_preview"
      ]
    },
    {
      "id": "multi_test_01234",
      "label": "个性化服务",
      "query": "查看我的尺码档案和购物偏好，为目标商品推荐尺码，并保存试穿反馈。",
      "gold": [
        "get_size_profile",
        "get_user_profile",
        "get_size_recommendation",
        "update_size_profile"
      ],
      "prediction": [
        "update_size_profile",
        "get_size_recommendation",
        "get_size_profile",
        "get_user_profile",
        "get_item_specs",
        "get_browsing_history",
        "update_default_address",
        "get_price_history",
        "get_low_stock_alert",
        "get_notification_preferences"
      ]
    },
    {
      "id": "chitchat_000007",
      "label": "闲聊请求",
      "type": "chat",
      "query": "番茄炒蛋做法能简单解释一下吗？",
      "gold": [],
      "prediction": []
    }
  ],
  "domains": [
    {
      "id": "product",
      "name": "商品",
      "description": "选品、规格、库存、评价与推荐",
      "tools": [
        {
          "id": "get_item_info",
          "name": "商品详情查询",
          "description": "查询商品标题、品牌、主图、价格、卖点和基础服务信息。",
          "operation": "read",
          "confusable": [
            "get_item_specs",
            "get_order_item_snapshot"
          ]
        },
        {
          "id": "get_item_specs",
          "name": "商品参数查询",
          "description": "查询商品材质、型号、尺寸、成分、功率、容量等规格参数。",
          "operation": "read",
          "confusable": [
            "get_item_info",
            "get_size_recommendation"
          ]
        },
        {
          "id": "get_sku_stock",
          "name": "SKU库存查询",
          "description": "查询指定颜色、尺码、版本或地区仓的可售库存和补货状态。",
          "operation": "read",
          "confusable": [
            "get_low_stock_alert",
            "get_warehouse_stock_region"
          ]
        },
        {
          "id": "get_price_history",
          "name": "价格历史查询",
          "description": "查询商品近期价格走势、历史低价、活动价和价格波动。",
          "operation": "read",
          "confusable": [
            "compare_item_price",
            "query_price_protection"
          ]
        },
        {
          "id": "compare_item_price",
          "name": "商品比价",
          "description": "比较多个商品、店铺或平台的到手价、运费和服务差异。",
          "operation": "compute",
          "confusable": [
            "calc_discount",
            "compare_promotion_options"
          ]
        },
        {
          "id": "get_item_reviews",
          "name": "商品评价查询",
          "description": "查询商品评价列表、评分、晒图和追评内容。",
          "operation": "read",
          "confusable": [
            "summarize_item_reviews",
            "get_item_qa"
          ]
        },
        {
          "id": "summarize_item_reviews",
          "name": "评价摘要生成",
          "description": "归纳评价中的优缺点、尺码反馈、质量问题和适合人群。",
          "operation": "compute",
          "confusable": [
            "get_item_reviews",
            "get_quality_issue_policy"
          ]
        },
        {
          "id": "get_item_qa",
          "name": "商品问答查询",
          "description": "查询买家问答、商家回复和常见购买疑问。",
          "operation": "read",
          "confusable": [
            "get_item_reviews"
          ]
        },
        {
          "id": "check_item_authenticity",
          "name": "正品保障核验",
          "description": "查询商品正品保障、授权资质、防伪说明和平台验真服务。",
          "operation": "decision",
          "confusable": [
            "get_brand_store_info",
            "get_item_warranty"
          ]
        },
        {
          "id": "get_item_warranty",
          "name": "商品保修查询",
          "description": "查询商品保修年限、保修范围、延保服务和官方维修入口。",
          "operation": "read",
          "confusable": [
            "get_repair_service_policy",
            "check_item_authenticity"
          ]
        },
        {
          "id": "get_size_recommendation",
          "name": "尺码推荐",
          "description": "根据商品尺码表和用户尺码档案推荐合适尺码。",
          "operation": "compute",
          "confusable": [
            "get_size_profile",
            "update_size_profile"
          ]
        },
        {
          "id": "get_similar_items",
          "name": "相似商品推荐",
          "description": "根据商品、浏览偏好或预算推荐相似款、平替款和同风格商品。",
          "operation": "read",
          "confusable": [
            "get_replacement_items",
            "get_recommendation_feed"
          ]
        },
        {
          "id": "get_replacement_items",
          "name": "替代商品推荐",
          "description": "当目标商品无货、超预算或不适合时推荐可替代商品。",
          "operation": "read",
          "confusable": [
            "get_similar_items",
            "get_low_stock_alert"
          ]
        },
        {
          "id": "get_brand_store_info",
          "name": "品牌店铺信息",
          "description": "查询品牌旗舰店、店铺评分、资质、发货地和售后服务。",
          "operation": "read",
          "confusable": [
            "check_item_authenticity",
            "get_item_reviews"
          ]
        },
        {
          "id": "get_category_rank",
          "name": "类目榜单查询",
          "description": "查询类目热销榜、好评榜、新品榜和趋势商品。",
          "operation": "read",
          "confusable": [
            "get_new_arrivals",
            "get_recommendation_feed"
          ]
        },
        {
          "id": "get_new_arrivals",
          "name": "新品查询",
          "description": "查询品牌或类目近期上新商品、上新时间和预售状态。",
          "operation": "read",
          "confusable": [
            "get_category_rank",
            "check_presale_status"
          ]
        },
        {
          "id": "get_low_stock_alert",
          "name": "库存提醒设置",
          "description": "为低库存、补货或到货商品设置提醒并返回提醒状态。",
          "operation": "write",
          "confusable": [
            "get_sku_stock",
            "check_presale_status"
          ]
        },
        {
          "id": "check_presale_status",
          "name": "预售状态查询",
          "description": "查询预售商品定金、尾款、发货时间和预售资格限制。",
          "operation": "read",
          "confusable": [
            "get_order_afterpay_status",
            "reserve_promotion_slot"
          ]
        }
      ]
    },
    {
      "id": "order",
      "name": "订单",
      "description": "订单状态、支付、发票与变更",
      "tools": [
        {
          "id": "get_order_list",
          "name": "订单列表查询",
          "description": "查询用户近期或指定时间范围内的订单列表，返回订单号、状态和创建时间。",
          "operation": "read",
          "confusable": [
            "get_order_detail",
            "get_purchase_history"
          ]
        },
        {
          "id": "get_order_detail",
          "name": "订单详情查询",
          "description": "查询单笔订单的商品、金额、收货地址、优惠和售后入口信息。",
          "operation": "read",
          "confusable": [
            "get_order_list",
            "get_order_item_snapshot"
          ]
        },
        {
          "id": "get_order_payment_status",
          "name": "订单支付状态查询",
          "description": "查询订单是否已支付、支付渠道、失败原因和待支付截止时间。",
          "operation": "read",
          "confusable": [
            "create_payment_retry",
            "get_bill_summary"
          ]
        },
        {
          "id": "get_order_invoice",
          "name": "订单发票查询",
          "description": "查询订单可开票状态、发票抬头、税号、发票下载或重开发票入口。",
          "operation": "read",
          "confusable": [
            "get_bill_summary"
          ]
        },
        {
          "id": "modify_order_address",
          "name": "修改订单地址",
          "description": "在订单未出库或允许改址时修改收货人、手机号和收货地址。",
          "operation": "write",
          "confusable": [
            "get_user_addresses",
            "change_delivery_method"
          ]
        },
        {
          "id": "cancel_order",
          "name": "取消订单",
          "description": "在订单允许取消时提交取消订单请求并返回取消结果或限制原因。",
          "operation": "write",
          "confusable": [
            "create_refund_request"
          ]
        },
        {
          "id": "get_bill_summary",
          "name": "账单汇总查询",
          "description": "查询订单或周期账单的商品金额、运费、优惠、实付和退款抵扣明细。",
          "operation": "read",
          "confusable": [
            "calc_discount",
            "get_order_invoice"
          ]
        },
        {
          "id": "get_payment_methods",
          "name": "支付方式查询",
          "description": "查询当前订单或用户可用的支付方式、限额和优惠支付渠道。",
          "operation": "read",
          "confusable": [
            "get_installment_plan"
          ]
        },
        {
          "id": "create_payment_retry",
          "name": "重新发起支付",
          "description": "在待支付或支付失败时重新生成支付请求，返回支付链接或收银台状态。",
          "operation": "write",
          "confusable": [
            "get_order_payment_status",
            "verify_payment_risk"
          ]
        },
        {
          "id": "verify_payment_risk",
          "name": "支付风险核验",
          "description": "核验支付异常、重复扣款、账户风控或高风险支付拦截原因。",
          "operation": "decision",
          "confusable": [
            "detect_abnormal_order",
            "check_account_risk"
          ]
        },
        {
          "id": "get_installment_plan",
          "name": "分期方案查询",
          "description": "查询订单可用分期数、每期金额、手续费和分期活动限制。",
          "operation": "compute",
          "confusable": [
            "get_payment_methods",
            "calc_discount"
          ]
        },
        {
          "id": "get_order_coupon_usage",
          "name": "订单用券明细",
          "description": "查询订单实际使用的优惠券、券门槛、抵扣金额和退券规则。",
          "operation": "read",
          "confusable": [
            "get_available_coupons",
            "apply_coupon"
          ]
        },
        {
          "id": "get_order_item_snapshot",
          "name": "下单商品快照",
          "description": "查询下单时商品标题、规格、价格、图片和服务承诺快照。",
          "operation": "read",
          "confusable": [
            "get_item_info",
            "get_item_specs"
          ]
        },
        {
          "id": "confirm_order_receipt",
          "name": "确认收货",
          "description": "对已送达订单提交确认收货动作，并返回售后时效提醒。",
          "operation": "write",
          "confusable": [
            "get_order_logistics",
            "create_aftersale_ticket"
          ]
        },
        {
          "id": "get_order_afterpay_status",
          "name": "先用后付状态",
          "description": "查询先用后付、尾款、补款或账期订单的还款状态和截止时间。",
          "operation": "read",
          "confusable": [
            "get_order_payment_status",
            "get_bill_summary"
          ]
        }
      ]
    },
    {
      "id": "aftersale",
      "name": "售后",
      "description": "退换、退款、维修与投诉处理",
      "tools": [
        {
          "id": "get_return_policy",
          "name": "退换货规则查询",
          "description": "查询商品七天无理由、特殊品类限制、运费承担和退换货时效。",
          "operation": "read",
          "confusable": [
            "create_refund_request",
            "create_exchange_request"
          ]
        },
        {
          "id": "create_refund_request",
          "name": "发起退款退货",
          "description": "为订单提交仅退款或退货退款申请，填写原因、金额和说明。",
          "operation": "write",
          "confusable": [
            "get_refund_status",
            "cancel_refund_request"
          ]
        },
        {
          "id": "get_refund_status",
          "name": "退款进度查询",
          "description": "查询退款、退货、价保退款的审核、寄回、到账和失败原因。",
          "operation": "read",
          "confusable": [
            "create_price_protection_claim",
            "get_order_coupon_usage"
          ]
        },
        {
          "id": "create_exchange_request",
          "name": "发起换货",
          "description": "为订单商品提交换货申请，选择新规格、原因和取件方式。",
          "operation": "write",
          "confusable": [
            "create_refund_request",
            "get_aftersale_ticket_status"
          ]
        },
        {
          "id": "get_repair_service_policy",
          "name": "维修政策查询",
          "description": "查询商品维修范围、保内保外、寄修方式和费用预估。",
          "operation": "read",
          "confusable": [
            "create_repair_ticket",
            "get_item_warranty"
          ]
        },
        {
          "id": "create_repair_ticket",
          "name": "创建维修单",
          "description": "为故障商品创建维修工单并返回寄修地址、预约方式和处理时效。",
          "operation": "write",
          "confusable": [
            "get_aftersale_ticket_status",
            "create_aftersale_ticket"
          ]
        },
        {
          "id": "get_aftersale_ticket_status",
          "name": "售后工单进度",
          "description": "查询售后、换货、维修或补寄工单的处理节点和预计完成时间。",
          "operation": "read",
          "confusable": [
            "get_refund_status",
            "get_service_queue_status"
          ]
        },
        {
          "id": "create_aftersale_ticket",
          "name": "创建售后工单",
          "description": "针对质量、破损、缺件、物流异常等问题创建售后处理工单。",
          "operation": "write",
          "confusable": [
            "create_manual_service_ticket",
            "request_reship_missing_item"
          ]
        },
        {
          "id": "request_reship_missing_item",
          "name": "缺件补寄申请",
          "description": "针对少发、漏发、配件缺失提交补寄申请并返回补寄进度。",
          "operation": "write",
          "confusable": [
            "create_aftersale_ticket",
            "get_aftersale_ticket_status"
          ]
        },
        {
          "id": "get_refund_amount_estimate",
          "name": "退款金额预估",
          "description": "根据订单金额、优惠、运费、使用权益和退货件数预估可退金额。",
          "operation": "compute",
          "confusable": [
            "get_bill_summary",
            "create_refund_request"
          ]
        },
        {
          "id": "upload_aftersale_evidence",
          "name": "上传售后凭证",
          "description": "上传破损照片、开箱视频、检测单等售后凭证并返回受理状态。",
          "operation": "write",
          "confusable": [
            "create_aftersale_ticket",
            "get_quality_issue_policy"
          ]
        },
        {
          "id": "cancel_refund_request",
          "name": "取消退款申请",
          "description": "取消尚未完成的退款或退货申请并返回可否恢复订单。",
          "operation": "write",
          "confusable": [
            "create_refund_request",
            "cancel_order"
          ]
        },
        {
          "id": "get_complaint_channels",
          "name": "投诉渠道查询",
          "description": "查询平台投诉、商家投诉、物流投诉和监管投诉入口及材料要求。",
          "operation": "read",
          "confusable": [
            "escalate_to_human_service",
            "create_manual_service_ticket"
          ]
        },
        {
          "id": "escalate_to_human_service",
          "name": "售后升级人工",
          "description": "当自动售后无法解决时升级人工客服并附带订单、问题和证据。",
          "operation": "write",
          "confusable": [
            "create_manual_service_ticket",
            "get_service_queue_status"
          ]
        },
        {
          "id": "get_quality_issue_policy",
          "name": "质量问题规则",
          "description": "查询质量问题、假货争议、破损和性能故障的判定与赔付规则。",
          "operation": "read",
          "confusable": [
            "check_item_authenticity",
            "create_aftersale_ticket"
          ]
        }
      ]
    },
    {
      "id": "promotion",
      "name": "优惠",
      "description": "活动、用券、积分与价保",
      "tools": [
        {
          "id": "get_current_promotions",
          "name": "当前活动查询",
          "description": "查询当前平台、店铺或类目的满减、直降、秒杀和主题活动。",
          "operation": "read",
          "confusable": [
            "compare_promotion_options",
            "get_flash_sale_status"
          ]
        },
        {
          "id": "get_available_coupons",
          "name": "可用优惠券查询",
          "description": "查询用户、商品或购物车可领取和可使用的优惠券列表。",
          "operation": "read",
          "confusable": [
            "apply_coupon",
            "get_order_coupon_usage"
          ]
        },
        {
          "id": "apply_coupon",
          "name": "应用优惠券",
          "description": "把指定优惠券应用到购物车或订单并返回抵扣结果。",
          "operation": "write",
          "confusable": [
            "get_available_coupons",
            "calc_discount"
          ]
        },
        {
          "id": "calc_discount",
          "name": "优惠金额计算",
          "description": "计算商品、购物车或订单在活动、券、会员价后的预计到手价。",
          "operation": "compute",
          "confusable": [
            "compare_promotion_options",
            "get_bill_summary"
          ]
        },
        {
          "id": "get_member_level",
          "name": "会员等级查询",
          "description": "查询用户会员等级、成长值、等级权益和保级进度。",
          "operation": "read",
          "confusable": [
            "get_member_price",
            "get_points_balance"
          ]
        },
        {
          "id": "get_member_price",
          "name": "会员价查询",
          "description": "查询商品面向当前会员等级的专属价格、限购和活动叠加规则。",
          "operation": "read",
          "confusable": [
            "calc_discount",
            "get_current_promotions"
          ]
        },
        {
          "id": "calc_points_deduction",
          "name": "积分抵扣计算",
          "description": "计算用户积分可抵扣金额、使用门槛和抵扣后应付金额。",
          "operation": "compute",
          "confusable": [
            "get_points_balance",
            "calc_discount"
          ]
        },
        {
          "id": "get_points_balance",
          "name": "积分余额查询",
          "description": "查询用户可用积分、冻结积分、即将过期积分和积分明细。",
          "operation": "read",
          "confusable": [
            "calc_points_deduction",
            "get_member_level"
          ]
        },
        {
          "id": "query_price_protection",
          "name": "价保资格查询",
          "description": "查询订单或商品是否满足价保条件、可退差价和截止时间。",
          "operation": "decision",
          "confusable": [
            "create_price_protection_claim",
            "get_price_history"
          ]
        },
        {
          "id": "create_price_protection_claim",
          "name": "申请价保",
          "description": "对符合条件的订单提交价保申请并返回审核状态。",
          "operation": "write",
          "confusable": [
            "query_price_protection",
            "get_refund_status"
          ]
        },
        {
          "id": "build_bundle_plan",
          "name": "凑单方案生成",
          "description": "根据满减门槛、购物车金额和偏好推荐凑单商品组合。",
          "operation": "compute",
          "confusable": [
            "calc_discount",
            "get_similar_items"
          ]
        },
        {
          "id": "get_flash_sale_status",
          "name": "秒杀状态查询",
          "description": "查询秒杀活动开始时间、库存、限购和当前抢购状态。",
          "operation": "read",
          "confusable": [
            "get_current_promotions",
            "reserve_promotion_slot"
          ]
        },
        {
          "id": "reserve_promotion_slot",
          "name": "活动资格预约",
          "description": "预约秒杀、预售、会员日等活动资格或开抢提醒。",
          "operation": "write",
          "confusable": [
            "get_low_stock_alert",
            "check_presale_status"
          ]
        },
        {
          "id": "get_gift_promotion",
          "name": "赠品活动查询",
          "description": "查询买赠、满赠、赠品库存和赠品随单规则。",
          "operation": "read",
          "confusable": [
            "calc_discount",
            "get_checkout_preview"
          ]
        },
        {
          "id": "compare_promotion_options",
          "name": "优惠方案比较",
          "description": "比较不同活动、券、会员价和积分组合下的最终价格。",
          "operation": "compute",
          "confusable": [
            "calc_discount",
            "apply_coupon"
          ]
        }
      ]
    },
    {
      "id": "delivery",
      "name": "配送",
      "description": "物流、时效、运费与安装",
      "tools": [
        {
          "id": "get_order_logistics",
          "name": "订单物流查询",
          "description": "查询订单包裹轨迹、快递公司、当前节点和预计送达时间。",
          "operation": "read",
          "confusable": [
            "estimate_delivery_time",
            "get_lost_package_process"
          ]
        },
        {
          "id": "estimate_delivery_time",
          "name": "配送时效预估",
          "description": "根据商品、地址、仓库和配送方式预估到达时间。",
          "operation": "compute",
          "confusable": [
            "get_delivery_options",
            "query_delivery_fee"
          ]
        },
        {
          "id": "get_delivery_options",
          "name": "配送方式查询",
          "description": "查询可选快递、同城送、门店自提、预约配送和安装配送方式。",
          "operation": "read",
          "confusable": [
            "select_delivery_slot",
            "change_delivery_method"
          ]
        },
        {
          "id": "select_delivery_slot",
          "name": "预约配送时段",
          "description": "为支持预约的订单选择或修改送货日期和时间段。",
          "operation": "write",
          "confusable": [
            "change_delivery_method",
            "schedule_installation"
          ]
        },
        {
          "id": "get_pickup_points",
          "name": "自提点查询",
          "description": "查询用户附近自提点、营业时间、可存放时长和取件要求。",
          "operation": "read",
          "confusable": [
            "change_delivery_method",
            "get_delivery_options"
          ]
        },
        {
          "id": "change_delivery_method",
          "name": "修改配送方式",
          "description": "在允许范围内把订单切换为快递、自提、同城送或预约配送。",
          "operation": "write",
          "confusable": [
            "modify_order_address",
            "select_delivery_slot"
          ]
        },
        {
          "id": "can_merge_ship",
          "name": "合并发货判断",
          "description": "判断新商品或多个订单是否同仓、同地址并可合并发货。",
          "operation": "decision",
          "confusable": [
            "split_shipment_plan",
            "get_warehouse_stock_region"
          ]
        },
        {
          "id": "split_shipment_plan",
          "name": "拆单发货方案",
          "description": "查询多商品因仓库、库存、预售或重量限制导致的拆单发货计划。",
          "operation": "read",
          "confusable": [
            "can_merge_ship",
            "get_warehouse_stock_region"
          ]
        },
        {
          "id": "get_warehouse_stock_region",
          "name": "区域仓库存查询",
          "description": "查询指定地区仓库库存、发货仓和跨区调拨可能性。",
          "operation": "read",
          "confusable": [
            "get_sku_stock",
            "estimate_delivery_time"
          ]
        },
        {
          "id": "query_delivery_fee",
          "name": "运费查询",
          "description": "查询商品、地址、重量、会员权益和活动后的运费。",
          "operation": "compute",
          "confusable": [
            "get_checkout_preview",
            "calc_discount"
          ]
        },
        {
          "id": "get_lost_package_process",
          "name": "丢件处理查询",
          "description": "查询物流长时间停滞、疑似丢件的处理流程、赔付和工单入口。",
          "operation": "read",
          "confusable": [
            "create_aftersale_ticket",
            "create_manual_service_ticket"
          ]
        },
        {
          "id": "schedule_installation",
          "name": "安装服务预约",
          "description": "为大件、家电或家具订单预约安装时间、师傅和服务范围。",
          "operation": "write",
          "confusable": [
            "select_delivery_slot",
            "get_item_warranty"
          ]
        }
      ]
    },
    {
      "id": "user",
      "name": "用户",
      "description": "画像、历史、地址与个性化",
      "tools": [
        {
          "id": "get_user_profile",
          "name": "用户画像查询",
          "description": "查询用户偏好类目、会员信息、常用地址和基础购物画像。",
          "operation": "read",
          "confusable": [
            "get_member_level",
            "get_recommendation_feed"
          ]
        },
        {
          "id": "get_browsing_history",
          "name": "浏览记录查询",
          "description": "查询用户最近浏览的商品、类目、时间和停留偏好。",
          "operation": "read",
          "confusable": [
            "get_recommendation_feed",
            "get_favorite_items"
          ]
        },
        {
          "id": "get_purchase_history",
          "name": "购买历史查询",
          "description": "查询用户历史购买商品、复购周期、常买品牌和订单摘要。",
          "operation": "read",
          "confusable": [
            "get_order_list",
            "get_recommendation_feed"
          ]
        },
        {
          "id": "get_favorite_items",
          "name": "收藏商品查询",
          "description": "查询用户收藏、降价关注和心愿单商品。",
          "operation": "read",
          "confusable": [
            "get_low_stock_alert",
            "get_price_history"
          ]
        },
        {
          "id": "get_user_addresses",
          "name": "收货地址查询",
          "description": "查询用户可用收货地址、默认地址和地址服务范围。",
          "operation": "read",
          "confusable": [
            "update_default_address",
            "modify_order_address"
          ]
        },
        {
          "id": "update_default_address",
          "name": "默认地址修改",
          "description": "设置或更新用户默认收货地址，返回地址校验结果。",
          "operation": "write",
          "confusable": [
            "modify_order_address",
            "get_pickup_points"
          ]
        },
        {
          "id": "get_size_profile",
          "name": "尺码档案查询",
          "description": "查询用户身高、体重、鞋码、常穿尺码和尺码反馈。",
          "operation": "read",
          "confusable": [
            "get_size_recommendation",
            "update_size_profile"
          ]
        },
        {
          "id": "update_size_profile",
          "name": "尺码档案更新",
          "description": "更新用户尺码偏好和试穿反馈，用于后续尺码推荐。",
          "operation": "write",
          "confusable": [
            "get_size_recommendation"
          ]
        },
        {
          "id": "get_recommendation_feed",
          "name": "个性化推荐流",
          "description": "基于画像、浏览、购买和收藏生成个性化商品推荐流。",
          "operation": "read",
          "confusable": [
            "get_similar_items",
            "get_category_rank"
          ]
        },
        {
          "id": "get_notification_preferences",
          "name": "通知偏好查询",
          "description": "查询用户对降价、到货、物流、售后和活动提醒的订阅偏好。",
          "operation": "read",
          "confusable": [
            "get_low_stock_alert",
            "reserve_promotion_slot"
          ]
        }
      ]
    },
    {
      "id": "cart",
      "name": "购物车",
      "description": "购物车管理、结算与下单",
      "tools": [
        {
          "id": "create_cart_item",
          "name": "加入购物车",
          "description": "把指定商品 SKU 和数量加入购物车并返回购物车项状态。",
          "operation": "write",
          "confusable": [
            "update_cart_quantity",
            "get_cart_summary"
          ]
        },
        {
          "id": "get_cart_summary",
          "name": "购物车汇总",
          "description": "查询购物车商品、数量、金额、优惠、失效商品和可结算状态。",
          "operation": "read",
          "confusable": [
            "get_checkout_preview",
            "build_bundle_plan"
          ]
        },
        {
          "id": "update_cart_quantity",
          "name": "修改购物车数量",
          "description": "修改购物车中某个商品的购买数量并返回库存和金额变化。",
          "operation": "write",
          "confusable": [
            "create_cart_item",
            "remove_cart_item"
          ]
        },
        {
          "id": "remove_cart_item",
          "name": "移除购物车商品",
          "description": "从购物车删除指定商品或清理失效商品。",
          "operation": "write",
          "confusable": [
            "save_item_for_later",
            "update_cart_quantity"
          ]
        },
        {
          "id": "save_item_for_later",
          "name": "移入稍后购买",
          "description": "把购物车商品移入稍后购买或收藏列表。",
          "operation": "write",
          "confusable": [
            "get_favorite_items",
            "remove_cart_item"
          ]
        },
        {
          "id": "get_checkout_preview",
          "name": "结算预览",
          "description": "生成结算页预览，包含商品、地址、运费、优惠、实付和风险提示。",
          "operation": "compute",
          "confusable": [
            "submit_order",
            "validate_checkout_items"
          ]
        },
        {
          "id": "submit_order",
          "name": "提交订单",
          "description": "在结算信息确认后创建订单并返回订单号和待支付状态。",
          "operation": "write",
          "confusable": [
            "create_payment_retry",
            "get_order_detail"
          ]
        },
        {
          "id": "validate_checkout_items",
          "name": "结算商品校验",
          "description": "校验购物车商品是否可售、限购、库存、地址和配送限制。",
          "operation": "decision",
          "confusable": [
            "check_purchase_limit",
            "get_sensitive_category_rules"
          ]
        }
      ]
    },
    {
      "id": "risk",
      "name": "风控",
      "description": "订单、支付、账户与规则校验",
      "tools": [
        {
          "id": "detect_abnormal_order",
          "name": "异常订单识别",
          "description": "识别订单金额、地址、频次、售后行为等异常风险。",
          "operation": "decision",
          "confusable": [
            "verify_payment_risk",
            "check_account_risk"
          ]
        },
        {
          "id": "get_sensitive_category_rules",
          "name": "敏感品类规则",
          "description": "查询药品、酒类、跨境、虚拟品等敏感品类购买和配送限制。",
          "operation": "read",
          "confusable": [
            "check_purchase_limit",
            "validate_checkout_items"
          ]
        },
        {
          "id": "check_purchase_limit",
          "name": "限购规则校验",
          "description": "校验商品或活动的用户限购、地区限购、年龄限制和频次限制。",
          "operation": "decision",
          "confusable": [
            "get_sensitive_category_rules",
            "validate_checkout_items"
          ]
        },
        {
          "id": "check_account_risk",
          "name": "账户风险查询",
          "description": "查询账户登录、支付、券使用、售后滥用等风险状态和限制原因。",
          "operation": "decision",
          "confusable": [
            "verify_payment_risk",
            "detect_abnormal_order"
          ]
        },
        {
          "id": "create_manual_service_ticket",
          "name": "创建人工客服单",
          "description": "为复杂订单、风控、售后或投诉问题创建人工客服工单。",
          "operation": "write",
          "confusable": [
            "escalate_to_human_service",
            "get_service_queue_status"
          ]
        },
        {
          "id": "get_service_queue_status",
          "name": "客服排队状态",
          "description": "查询人工客服工单排队、预计响应时间和当前处理人状态。",
          "operation": "read",
          "confusable": [
            "create_manual_service_ticket",
            "get_aftersale_ticket_status"
          ]
        },
        {
          "id": "generate_risk_notice",
          "name": "风险提示生成",
          "description": "为限购、支付失败、敏感品类、异常订单生成面向用户的风险提示文案。",
          "operation": "compute",
          "confusable": [
            "get_sensitive_category_rules",
            "detect_abnormal_order"
          ]
        }
      ]
    }
  ],
  "metrics": {
    "intent": [
      {
        "label": "Keyword baseline",
        "short": "规则基线",
        "accuracy": 0.5022,
        "f1": 0.4884,
        "kind": "baseline"
      },
      {
        "label": "Qwen3-0.6B base",
        "short": "0.6B 未微调",
        "accuracy": 0.8476,
        "f1": 0.8374,
        "kind": "base"
      },
      {
        "label": "Qwen3-0.6B LoRA checkpoint-2000（最终路由）",
        "short": "0.6B 最终路由",
        "accuracy": 1,
        "f1": 1,
        "kind": "final"
      },
      {
        "label": "Qwen3-1.7B base",
        "short": "1.7B 未微调",
        "accuracy": 0.9047,
        "f1": 0.8838,
        "kind": "base"
      },
      {
        "label": "Qwen3-1.7B LoRA（关键词与成本对照）",
        "short": "1.7B 对照",
        "accuracy": 0.9996,
        "f1": 0.9995,
        "kind": "trained"
      }
    ]
  },
  "audit": [
    {
      "value": "0",
      "label": "归一化请求重合",
      "detail": "训练 / 测试精确重合"
    },
    {
      "value": "0",
      "label": "Trace ID 重合",
      "detail": "训练与测试轨迹 ID 不重合"
    },
    {
      "value": "0",
      "label": "工具目录触发词命中",
      "detail": "测试目标触发词命中率"
    },
    {
      "value": "0",
      "label": "相似请求写法重合",
      "detail": "相似写法分组是否同时出现在训练与测试"
    },
    {
      "value": "TRUE",
      "label": "划分检查通过",
      "detail": "生成数据全部检查通过"
    }
  ],
  "contextAudit": [
    {
      "value": 0.936,
      "label": "上下文骨架曾出现",
      "interpretation": "通用商品、地区和预算框架自然复用"
    },
    {
      "value": 0.019667,
      "label": "同骨架精确工具序列重合",
      "interpretation": "同一场景骨架对应多种能力组合"
    },
    {
      "value": 0.0292,
      "label": "Context matcher AllHit@10",
      "interpretation": "能力语义是主要预测信号"
    }
  ]
};
