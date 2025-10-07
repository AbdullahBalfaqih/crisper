'use client';

import React from 'react';
import type { Recipe } from './recipes-modal';

interface RecipeCardReceiptProps {
  recipe: Recipe & { category_name?: string, restaurantName?: string };
  logo: string | null;
}

export const RecipeCardReceipt = React.forwardRef<HTMLDivElement, RecipeCardReceiptProps>(
  ({ recipe, logo }, ref) => {
    
    return (
      <div ref={ref}>
        <style>{`
          .receipt-container-recipe {
            width: 80mm;
            padding: 10px;
            box-sizing: border-box;
            font-family: 'Cairo', 'Almarai', sans-serif;
            background-color: #fff;
            color: #333;
            direction: rtl;
          }
          .recipe-header-small {
            text-align: center;
            margin-bottom: 10px;
          }
          .recipe-header-small img { max-height: 50px; max-width: 150px; margin-bottom: 5px; }
          .recipe-header-small h2 {
            font-size: 20px;
            margin: 0;
            color: #111;
          }
          .recipe-header-small p {
            color: #555;
            margin: 2px 0 0 0;
            font-size: 12px;
          }
          .recipe-section-small {
            margin-top: 15px;
          }
          .recipe-section-small h3 {
            font-size: 16px;
            color: #111;
            border-top: 2px dashed #555;
            border-bottom: 2px dashed #555;
            padding: 5px 0;
            margin: 10px 0;
            text-align: center;
          }
          .recipe-meta-small {
            font-size: 12px;
            padding: 0 5px;
          }
          .recipe-meta-small p {
            display: flex;
            justify-content: space-between;
            margin: 4px 0;
          }
           .recipe-meta-small strong {
            font-weight: 700;
          }
          .ingredients-list-small, .instructions-list-small {
            padding-right: 15px;
            font-size: 12px;
            line-height: 1.6;
          }
           .ingredients-list-small li, .instructions-list-small li {
            margin-bottom: 5px;
          }
          .instructions-list-small {
             list-style-type: decimal;
          }
          .recipe-footer-small {
            margin-top: 20px;
            text-align: center;
            font-size: 11px;
            color: #777;
            border-top: 1px solid #ccc;
            padding-top: 10px;
          }
        `}</style>
        <div className="receipt-container-recipe">
            <div className="recipe-header-small">
                {logo && <img src={logo} alt="Logo" />}
                <h2>{recipe.name}</h2>
                <p>{recipe.category_name}</p>
            </div>
            
            <div className="recipe-meta-small">
                <p><span>وقت التحضير:</span> <strong>{recipe.prep_time_minutes} دقيقة</strong></p>
                <p><span>وقت الطهي:</span> <strong>{recipe.cook_time_minutes} دقيقة</strong></p>
                <p><span>الوقت الإجمالي:</span> <strong>{(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} دقيقة</strong></p>
            </div>

            <div className="recipe-section-small">
                <h3>المكونات</h3>
                <ul className="ingredients-list-small">
                    {recipe.ingredients?.split(',').map((ing, i) => <li key={i}>{ing.trim()}</li>)}
                </ul>
            </div>

             <div className="recipe-section-small">
                <h3>طريقة التحضير</h3>
                <ol className="instructions-list-small">
                    {recipe.instructions?.split('.').filter(inst => inst.trim()).map((inst, i) => <li key={i}>{inst.trim()}</li>)}
                </ol>
            </div>
            
            <div className="recipe-footer-small">
                <p>{recipe.restaurantName} - بطاقة وصفة</p>
            </div>
        </div>
      </div>
    );
  }
);

RecipeCardReceipt.displayName = 'RecipeCardReceipt';
