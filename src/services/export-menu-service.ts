'use server';

import type { Product, Category } from '@/lib/types';

type MenuReportData = {
    products: Product[];
    categories: Category[];
};

export async function generateMenuHtml(data: MenuReportData): Promise<string> {
    const { products, categories } = data;

    const menuSections = categories.map(category => {
        const categoryProducts = products.filter(p => p.categoryId === category.id);
        if (categoryProducts.length === 0) return '';

        const productCards = categoryProducts.map(product => `
            <div class="product-card">
                <img src="${product.imageUrl}" alt="${product.name}" />
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="price">${product.price.toLocaleString('ar-SA')} ر.ي</p>
                </div>
            </div>
        `).join('');

        return `
            <section class="menu-section">
                <h2>${category.name}</h2>
                <div class="products-grid">
                    ${productCards}
                </div>
            </section>
        `;
    }).join('');

    return `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>قائمة الطعام</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap" rel="stylesheet">
            <style>
                body { 
                    font-family: 'Almarai', sans-serif; 
                    margin: 0; 
                    background-color: #FDFCF9; 
                    color: #111827; 
                }
                .container { 
                    max-width: 1200px; 
                    margin: auto;
                    padding: 2rem;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 2rem; 
                    border-bottom: 4px solid #F4991A;
                    padding-bottom: 1.5rem;
                }
                .header h1 { 
                    font-size: 3rem;
                    color: #F4991A; 
                    margin: 0;
                }
                .header p {
                    font-size: 1.1rem;
                    color: #555;
                }
                .menu-section {
                    margin-bottom: 3rem;
                }
                .menu-section h2 {
                    font-size: 2.5rem;
                    color: #28381C;
                    text-align: center;
                    margin-bottom: 2rem;
                    border-bottom: 2px solid #F5EFE6;
                    padding-bottom: 10px;
                }
                .products-grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
                    gap: 2rem; 
                }
                .product-card { 
                    background: #fff; 
                    border: 1px solid #F5EFE6; 
                    border-radius: 12px; 
                    box-shadow: 0 4px 15px rgba(0,0,0,0.07); 
                    overflow: hidden;
                    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
                }
                .product-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                }
                .product-card img { 
                    width: 100%; 
                    height: 200px; 
                    object-fit: cover; 
                }
                .product-info { 
                    padding: 1.5rem; 
                    text-align: center;
                }
                .product-info h3 { 
                    margin: 0 0 0.5rem 0; 
                    font-size: 1.5rem;
                    color: #111827;
                }
                .product-info .price {
                    font-size: 1.25rem;
                    font-weight: bold;
                    color: #F4991A;
                    margin: 0;
                }
                .footer { 
                    text-align: center; 
                    margin-top: 4rem; 
                    padding-top: 2rem;
                    border-top: 2px solid #F5EFE6;
                    color: #777;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <header class="header">
                    <h1>قائمة طعام كرسبر</h1>
                    <p>مخبوز بإتقان</p>
                </header>
                <main>
                    ${menuSections}
                </main>
                <footer class="footer">
                    <p>&copy; ${new Date().getFullYear()} كرسبر | جميع الحقوق محفوظة</p>
                </footer>
            </div>
        </body>
        </html>
    `;
}
