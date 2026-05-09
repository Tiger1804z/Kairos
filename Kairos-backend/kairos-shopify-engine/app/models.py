from pydantic import BaseModel

class OrderItemInput(BaseModel):
    product_id: str
    quantity: int
    unit_price: float
    
    
class ProductCostInput(BaseModel):
    product_id: str
    cost_per_unit: float
    
class ProfitabilityRequest(BaseModel):
    business_id: int
    period_start: str  # format "YYYY-MM-DD"
    period_end: str  # format "YYYY-MM-DD"
    order_items: list[OrderItemInput]
    product_costs: list[ProductCostInput]


# -----------------------------------------------------------------------------
# Insight Engine models
# -----------------------------------------------------------------------------

class SnapshotInput(BaseModel):
    product_id: str
    product_name: str
    revenue: float
    cogs: float
    gross_profit: float
    gross_margin_pct: float
    units_sold: int
    has_cost: bool


class OrderItemDetailInput(BaseModel):
    product_id: str
    quantity: int
    unit_price: float          # prix payé réellement
    original_price: float      # prix catalogue (avant remise)
    refunded_amount: float     # montant remboursé sur cette ligne


class InsightRequest(BaseModel):
    business_id: int
    period_start: str
    period_end: str
    snapshots: list[SnapshotInput]
    order_items: list[OrderItemDetailInput]
    
# -----------------------------------------------------------------------------
# Chat enrichi models (Semaine 9)
# -----------------------------------------------------------------------------

class InsightContextInput(BaseModel):
    type: str
    title: str
    description: str
    severity: str  # "info"|"warning"|"critical"
    product_id: str
    value: float
    
class ChatMessageInput(BaseModel):
    role: str  # "user" | "assistant"
    content: str
    
class ChatRequest(BaseModel):
    business_id: int
    question: str
    snapshots: list[SnapshotInput]
    insights: list[InsightContextInput]
    history: list[ChatMessageInput] = []