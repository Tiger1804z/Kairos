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