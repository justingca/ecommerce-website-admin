import axios from "axios";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Spinner from "./Spinner";
import {ReactSortable} from "react-sortablejs";

export default function ProductForm ({
    _id,
    title:existingTitle, 
    description:existingDescription, 
    price:existingPrice,
    images:existingImages,
    category: assignedCategory,
    properties: assignedProperties,
    }) {
    const [title, setTitle] = useState( existingTitle || '');
    const [category, setCategory] = useState(assignedCategory || '');
    const [productProperties, setProductProperties] = useState(assignedProperties || {});
    const [description, setDescription] = useState(existingDescription || '');
    const [price, setPrice] = useState(existingPrice || '');
    const [images, setImages] = useState(existingImages || []);
    const [goToProducts, setGoToProducts] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [categories, setCategories] = useState([]);
    const router = useRouter();
    useEffect(() => {
        axios.get('/api/categories').then(result => {
            setCategories(result.data);
        })
    }, []);

    async function createProduct(ev) {
        ev.preventDefault();
        const data = {title, description, price, images, category, properties:productProperties};
        if (_id) {
            //update
            await axios.put('/api/products', {...data, _id});
        } else {
            //create
            await axios.post('/api/products', data);
            
        }
        setGoToProducts(true);
    }
    if (goToProducts) {
        router.push('/products');
    }

    async function uploadImages(ev) {
        const files = ev.target?.files;
        if(files?.length > 0) {
            setIsUploading(true);
            const data = new FormData();
            for (const file of files) {
                data.append('file', file)
            }
            const res = await axios.post('/api/upload', data);
            setImages(oldImages => {
                return[...oldImages, ...res.data.links];
            });
            setIsUploading(false);
        }
    }

    function updateImagesOrder(images) {
        setImages(images);
    }

    function setProductProp(propName, value) {
        setProductProperties(prev => {
            const newProductProps = {...prev};
            newProductProps[propName] = value;
            return newProductProps;
        });
    }

    const propertiesToFill = [];
    if (categories.length > 0 && category) {
       let selectedCatInfo =  categories.find(({_id}) => _id === category);
       propertiesToFill.push(...selectedCatInfo.properties);
       while(selectedCatInfo?.parent?.id) {
        const parentCateg = categories.find(({_id}) => _id === selectedCatInfo.parent?.id);
        propertiesToFill.push(...parentCateg.properties);
        selectedCatInfo = parentCateg;
       }
    }

    return (
            <form onSubmit={createProduct}>
                <label>Product Name</label>
                <input 
                type="text" 
                placeholder="product name" 
                value={title} 
                onChange={ev => setTitle(ev.target.value)}/>
                <label>Category</label>
                <select value={category} onChange={ev => setCategory(ev.target.value)}>
                    <option value=''>Uncategorized</option>
                    {categories.length > 0 && categories.map(categ => (
                        <option value={categ._id}>{categ.name}</option>
                    ))}
                </select>
                {propertiesToFill.length > 0 && propertiesToFill.map(p => (
                    <div className="flex gap-1">
                        <div>{p.name}</div>
                        <select value={productProperties[p.name]}
                                onChange={ev =>
                                setProductProp(p.name, ev.target.value)
                                }
                        >
                            {p.values.map(v => (
                                <option value={v}>{v}</option>
                            ))}
                        </select>
                    </div>
                ))}
                <label>
                    Photos 
                </label>
                <div className="mb-2 flex flex-wrap gap-2">
                    <ReactSortable className="flex flex-wrap gap-1" list={images} setList={updateImagesOrder}>
                    {images?.length > 0 && images.map(link => (
                        <div key={link} className="inline-block h-24">
                            <img src={link} alt="" className="rounded-lg"></img>
                        </div>

                    ))}
                    </ReactSortable>
                    {isUploading && (
                        <div className="h-24 p-1 flex items-center">
                            <Spinner/>
                        </div>
                    )} 
                    <label className="w-32 h-32 border text-center flex items-center justify-center text-sm gap-1 cursor-pointer text-gray-500 rounded-md bg-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        <div>
                            Upload
                        </div>
                        <input type="file" onChange={uploadImages} className="hidden"/>
                    </label>
                    {!images?.length && (
                        <div>No photos in this product</div>
                    )}
                </div>

                <label>Description</label>
                <textarea 
                placeholder="product description"
                value={description}
                onChange={ev => setDescription(ev.target.value)}
                />

                <label>Price (in USD)</label>
                <input 
                type="text" 
                placeholder="price" 
                value={price}
                onChange={ev => setPrice(ev.target.value)}
                />
                <button type="submit" className="btn-primary">Save</button>
            </form>
    )
}