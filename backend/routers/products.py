from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas import CategoryWithProducts
import crud

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("/menu", response_model=list[CategoryWithProducts])
def get_menu(db: Session = Depends(get_db)):
    """
    Returns all categories with their available products.
    No authentication required — anyone can browse the menu.
    """
    categories = crud.get_all_categories_with_products(db)
    return [
        CategoryWithProducts(
            id=cat.id,
            name=cat.name,
            display_order=cat.display_order,
            products=[
                {
                    "id": p.id,
                    "name": p.name,
                    "price": p.price,
                    "is_available": p.is_available,
                    "category_id": p.category_id,
                }
                for p in cat.products
                if p.is_available
            ],
        )
        for cat in categories
    ]
