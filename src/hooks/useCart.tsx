import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CART_STORAGE = "@RocketShoes:cart";

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem(CART_STORAGE); //Buscar dados do localStorage

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      const { data } = await api.get(`stock/${productId}`);
      console.log('stocks', data);

      const amount = data.amount;
      //verifica se tem o produto no estoque

      //busca o produto que será adicionado
      api.get(`products/${productId}`).then(r => {
        const product = r.data;
        console.log('ppp', product)

        //verifica se o produto já existe no carrinho atual            
        const productInCart = cart.find(cartItem => cartItem.id === productId);
        //const hasProductInCart = productInCart ? true : false;
        const newAmount = productInCart?.amount ? productInCart?.amount + 1 : 0;

        if(amount < newAmount){
          toast.error('Quantidade solicitada fora de estoque');
          return;        
        }                  
        //se já tiver um produto igual ele só altera a quantidade
        if (productInCart) {
          const updatedProductQuantity = cart.map(item => {
            if (item.id === product.id) {
              item.amount++;
            }
            return item;
          })

          //atualiza no carrinho de compras a quantidade
          setCart(updatedProductQuantity);
          localStorage.setItem(CART_STORAGE, JSON.stringify(updatedProductQuantity))

        } else { //senão adiciona o produto normalmente
          product.amount = 1;
          setCart([...cart, product]);
          localStorage.setItem(CART_STORAGE, JSON.stringify([...cart, product]))
        }

      }).catch(error => {
        throw Error();
      })     

    } catch {
      // TODO
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      //verifica se o produto existe na lista
      const hasProductExists = cart.find(product => product.id === productId) != undefined ? true : false;
      if(!hasProductExists){
        toast.error('Erro na remoção do produto');
        return;
      }

      //remove da lista o produto enviado
      const updatedProducts = cart.filter(product => product.id !== productId);
      //atualiza no carrinho a lista de produtos
      setCart(updatedProducts);
      //atualiza na session
      localStorage.setItem(CART_STORAGE, JSON.stringify(updatedProducts));

    } catch {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {    
    console.log('amount post', amount);

    try {
      // TODO
      if(amount <= 0 ){        
        return;
      }
      
      const stock = await api.get(`/stock/${productId}`);

      const stockAmount = stock.data.amount;


      if(amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedCart = [...cart];
      const productExists = updatedCart.find(product => product.id === productId);

      if(productExists) {
        productExists.amount = amount;
        setCart(updatedCart);
        localStorage.setItem(CART_STORAGE, JSON.stringify(updatedCart));
      }else{
        throw Error();
      }

      // //busca o produto no carrinho
      // const product = cart.find(product => product.id === productId);

      // //se o produto não existir no carrinho retorna
      // if(product === undefined)
      //   throw Error();

      // //se a quantidade do produto for menor igual a 0, encerrar
      // if (product?.amount !== undefined && product.amount <= 0)
      //   return;

      // //verifica no estoque se existe a quantidade solicitada
      // api.get(`stock/${product?.id}`).then(response => {
        
      //   const amountResult = response.data.amount;
      //   if (amount > amountResult) {
      //     toast.error('Quantidade solicitada fora de estoque');
      //     return;
      //   }
      //   //atualiza na localStorage a quantidade desejada
      //   let productsCartStorage:Product[] = JSON.parse(localStorage.getItem(CART_STORAGE) || '');
      //   let productsUpdatedAmount = productsCartStorage.map(product => {
      //     if(product.id === productId){
      //       product.amount = amount;
      //     }

      //     return product;
      //   });
        
      //   setCart(productsUpdatedAmount);
      //   localStorage.setItem(CART_STORAGE, JSON.stringify(productsUpdatedAmount));

      //})

    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto');
      return;
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
