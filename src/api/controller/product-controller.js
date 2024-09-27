import axios from 'axios';

export const getProducts = async (req, res) => {
  const strapiUrl = 'http://localhost:1337';
  const STRAPI_API_TOKEN = '66e7f3a3068c2ce8c6674c8ecdc5e71787196657ab5cdec63cdfb24eefc04dae4695a777ccb4e60e6a2b0e1bade209cb9cbb1d22e358723d0d375edaaca44c86edf8ff4cb23e056d9f2beed344fffdf4cb210743da94009ba821c71ae0e778dd1a3c64c9c3d6f58ff55b1bcd07d5e7861518b5ca96b9637c43d087fb94682d12';

  try {
    const response = await axios.get(`${strapiUrl}/api/categories?populate=*`, {
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
    });

    const formattedProducts = response.data.data.map((product) => {
      const { id, attributes } = product;
      const description = attributes.description?.[0]?.children?.[0]?.text;
      const image = attributes.images?.data?.map((image) => (image.attributes.url)) // Get first image only

      // Handle price based on your Strapi data structure
      const price = attributes.price?.amount || attributes.variants?.[0]?.prices?.[0]?.amount;

      const variants = attributes.variants?.map((variant) => ({
        title: variant.title,
        prices: variant.prices,
        options: variant.options,
        inventory_quantity: variant.inventory_quantity,
        manage_inventory: variant.manage_inventory,
      }));

      return {
        title: attributes.title,
        description,
        handle: attributes.handle,
        images: [image], // Array with just the first image
        options: attributes.options,
        variants,
      };
    });

    res.json(formattedProducts);
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).json({ error: error.message });
  }
};


    // export const getProducts = async (req, res) => {
  //     const strapiUrl = 'http://localhost:1337'
  //     const STRAPI_API_TOKEN = '66e7f3a3068c2ce8c6674c8ecdc5e71787196657ab5cdec63cdfb24eefc04dae4695a777ccb4e60e6a2b0e1bade209cb9cbb1d22e358723d0d375edaaca44c86edf8ff4cb23e056d9f2beed344fffdf4cb210743da94009ba821c71ae0e778dd1a3c64c9c3d6f58ff55b1bcd07d5e7861518b5ca96b9637c43d087fb94682d12'
  //     try {
  //       const response = await axios.get(`${strapiUrl}/api/categories?populate=*`, {
  //         headers: {
  //           Authorization: `Bearer ${STRAPI_API_TOKEN}`,
  //         },
  //       });
  //     const data = await response.json();
  //     const categories = data?.data?.map((category) => {
  //       return {
  //         id: category?.id,
  //         name: category?.attributes?.name,
  //         description: category?.attributes?.description,
  //         imageUrl: category?.attributes?.image?.data?.attributes?.url,  // Adjust the path based on your Strapi setup
  //         createdAt: category?.attributes?.createdAt,
  //         updatedAt: category?.attributes?.updatedAt,
  //       };
  //     });
  
  //      res.json({ categories });
  
  //     } catch (error) {
  //       console.error("Error in /store/categories route:", error.message);
  //       res.status(500).json({ error: error.message });
  //     }
  //   }


  