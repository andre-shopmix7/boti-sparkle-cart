import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BoticarioProduct {
  name: string;
  brand: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  rating?: number;
  reviewCount?: number;
  installments?: number;
  installmentPrice?: number;
  imageUrl?: string;
  productUrl?: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

async function scrapeBoticarioPage(url: string): Promise<BoticarioProduct[]> {
  try {
    console.log(`Scraping: ${url}`)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      }
    })
    
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`)
      return []
    }
    
    const html = await response.text()
    return extractProducts(html, url)
  } catch (error) {
    console.error(`Error scraping ${url}:`, error)
    return []
  }
}

function extractProducts(html: string, baseUrl: string): BoticarioProduct[] {
  const products: BoticarioProduct[] = []
  
  // Parse HTML to extract product data
  // This is a simplified version - in reality, you'd use a proper HTML parser
  const productMatches = html.matchAll(/"name":\s*"([^"]+)"/g)
  const priceMatches = html.matchAll(/"price":\s*([0-9.]+)/g)
  const originalPriceMatches = html.matchAll(/"listPrice":\s*([0-9.]+)/g)
  const imageMatches = html.matchAll(/"image":\s*\["([^"]+)"/g)
  
  const names = Array.from(productMatches).map(m => m[1])
  const prices = Array.from(priceMatches).map(m => parseFloat(m[1]))
  const originalPrices = Array.from(originalPriceMatches).map(m => parseFloat(m[1]))
  const images = Array.from(imageMatches).map(m => m[1])
  
  // Combine the data
  const minLength = Math.min(names.length, prices.length)
  
  for (let i = 0; i < minLength; i++) {
    if (names[i] && prices[i] > 0) {
      const originalPrice = originalPrices[i] || undefined
      let discountPercentage = 0
      
      if (originalPrice && originalPrice > prices[i]) {
        discountPercentage = Math.round(((originalPrice - prices[i]) / originalPrice) * 100)
      }
      
      products.push({
        name: names[i].replace(/\\"/g, '"').trim(),
        brand: 'Boticário',
        price: prices[i],
        originalPrice,
        discountPercentage,
        imageUrl: images[i] ? `https:${images[i]}` : undefined,
        installments: Math.ceil(prices[i] / 20), // Estimate installments
        installmentPrice: Math.ceil((prices[i] / Math.ceil(prices[i] / 20)) * 100) / 100
      })
    }
  }
  
  return products
}

async function insertProducts(products: BoticarioProduct[]) {
  let successCount = 0
  const errors: string[] = []
  
  for (const product of products) {
    try {
      // Check if product already exists
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('name', product.name)
        .eq('brand', product.brand)
        .single()
      
      if (existing) {
        errors.push(`Produto já existe: ${product.name}`)
        continue
      }
      
      const { error } = await supabase
        .from('products')
        .insert({
          name: product.name,
          brand: product.brand,
          description: product.description || `${product.name} - Produto O Boticário`,
          price: product.price,
          original_price: product.originalPrice,
          discount_percentage: product.discountPercentage || 0,
          stock_quantity: 10,
          rating: product.rating || 4.5,
          review_count: product.reviewCount || 50,
          installments: product.installments || 1,
          installment_price: product.installmentPrice,
          is_active: true,
          is_featured: false,
          tags: ['boticário', 'importado', 'scraping']
        })
      
      if (error) {
        errors.push(`Erro ao inserir ${product.name}: ${error.message}`)
      } else {
        successCount++
      }
      
    } catch (error) {
      errors.push(`Erro inesperado para ${product.name}: ${error}`)
    }
  }
  
  return { successCount, errors }
}

async function backgroundScraping() {
  console.log('Starting background scraping task')
  
  const categories = [
    'https://www.boticario.com.br/perfumaria/perfumes-masculinos/',
    'https://www.boticario.com.br/perfumaria/perfumes-femininos/', 
    'https://www.boticario.com.br/maquiagem/',
    'https://www.boticario.com.br/cuidados/rosto/',
    'https://www.boticario.com.br/cuidados/corpo/'
  ]
  
  let allProducts: BoticarioProduct[] = []
  
  for (const categoryUrl of categories) {
    const products = await scrapeBoticarioPage(categoryUrl)
    allProducts = allProducts.concat(products)
    
    // Delay between requests to be respectful
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  console.log(`Found ${allProducts.length} products total`)
  
  if (allProducts.length > 0) {
    const result = await insertProducts(allProducts)
    console.log(`Inserted ${result.successCount} products successfully`)
    console.log(`Errors: ${result.errors.length}`)
    
    // Log result to database or external service if needed
    return result
  }
  
  return { successCount: 0, errors: ['No products found'] }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action } = await req.json()
    
    if (action === 'start') {
      // Start background task without waiting for it
      EdgeRuntime.waitUntil(backgroundScraping())
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Scraping iniciado em background. Os produtos serão cadastrados automaticamente.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }
    
    return new Response(
      JSON.stringify({ success: false, message: 'Ação inválida' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

// Handle function shutdown
addEventListener('beforeunload', (ev) => {
  console.log('Function shutdown due to:', ev.detail?.reason)
})