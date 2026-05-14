"use client"

ProductModel.attributes = {
    title: {},
    price: {},
    type: "string",
    filament: "string",
    description: "string",
    dimensions: {},
    deliveryTime: "string",
    images: [],
    options: []
}

export function ProductModel() {
    return (
        <div>
            <h1>Product Model</h1>
            <p>This is a placeholder for the ProductModel component.</p>
        </div>
    )
}