"""
Seed script — run once after migrations to populate:
  - All menu categories and products
  - (Owner credentials are in .env, not DB)

Usage:
    cd backend
    python seed.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, engine
from models import Base, Category, Product

MENU = [
    {
        "name": "MAGGIE",
        "display_order": 1,
        "products": [
            ("Veg Maggie", 49),
            ("Cheese Maggie", 49),
            ("Cheese Corn Maggie", 59),
            ("Veg Cheese Maggie", 59),
        ],
    },
    {
        "name": "CORNS",
        "display_order": 2,
        "products": [
            ("Masala Sweet Corn", 49),
            ("Crispy Corn", 79),
        ],
    },
    {
        "name": "BEVERAGES",
        "display_order": 3,
        "products": [
            ("Hot Coffee", 20),
            ("Cold Coffee", 59),
            ("Cold Coffee With Ice Cream", 69),
        ],
    },
    {
        "name": "SHAKES",
        "display_order": 4,
        "products": [
            ("Pineapple Shake", 59),
            ("Strawberry Shake", 69),
            ("Black Current Shake", 69),
            ("Kit Kat Shake", 79),
            ("Oreo Shake", 79),
        ],
    },
    {
        "name": "SANDWICH",
        "display_order": 5,
        "products": [
            ("Paneer Masti", 59),
            ("Cheese Corn", 69),
        ],
    },
    {
        "name": "PIZZA",
        "display_order": 6,
        "products": [
            ("Cheese Corn Pizza", 109),
            ("Veggie Pizza", 119),
            ("Tandoori Paneer Pizza", 129),
            ("Loaded Paneer Pizza", 159),
        ],
    },
    {
        "name": "BURGER & FRIES",
        "display_order": 7,
        "products": [
            ("Aloo Tikki Burger", 59),
            ("Aloo Tikki Cheese Burger", 69),
            ("Tandoori Cheese Burger", 79),
            ("Peri Peri Fries", 49),
        ],
    },
]


def seed():
    db = SessionLocal()
    try:
        # Check if already seeded
        existing = db.query(Category).count()
        if existing > 0:
            print(f"Already seeded — {existing} categories found. Skipping.")
            return

        total_products = 0
        for cat_data in MENU:
            category = Category(
                name=cat_data["name"],
                display_order=cat_data["display_order"],
            )
            db.add(category)
            db.flush()

            for product_name, price in cat_data["products"]:
                product = Product(
                    category_id=category.id,
                    name=product_name,
                    price=float(price),
                    is_available=True,
                )
                db.add(product)
                total_products += 1

        db.commit()
        print(f"Seeded {len(MENU)} categories and {total_products} products.")
        print("Owner credentials are stored in your .env file.")
        print("Done!")

    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
