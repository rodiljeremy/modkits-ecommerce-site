document.addEventListener('DOMContentLoaded', () => {
    /* ==========================================================================
       SLIDER COMPONENT LOGIC
       ========================================================================== */
    const wrapper = document.querySelector('.swiper-wrapper');
    const slides = document.querySelectorAll('.swiper-slide');
    const prevBtn = document.querySelector('.swiper-button-prev');
    const nextBtn = document.querySelector('.swiper-button-next');
    let currentIndex = 0;
    let autoSlideInterval;

    function updateSliderPosition() {
        if (!wrapper) return;
        wrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
    }

    function resetAutoSlideTimer() {
        clearInterval(autoSlideInterval);
        autoSlideInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % slides.length;
            updateSliderPosition();
        }, 5000);
    }

    if (nextBtn && prevBtn) {
        nextBtn.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % slides.length;
            updateSliderPosition();
            resetAutoSlideTimer();
        });

        prevBtn.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + slides.length) % slides.length;
            updateSliderPosition();
            resetAutoSlideTimer();
        });
    }

    resetAutoSlideTimer();

    /* ==========================================================================
       FETCH DATA AND RENDER FLEXBOX CARDS 
       ========================================================================== */
    const productGrid = document.getElementById('product-grid');
    let productDataList = [];
    let selectedCartItems = [];

    async function loadJsonCatalog() {
        try {
            const response = await fetch('./object.json');
            if (!response.ok) throw new Error(`Fetch error: ${response.status}`);

            const rawData = await response.json();

            // Accurately targets the lowercase "product" array key from your file
            productDataList = rawData.product || [];
            renderFlexboxGrid();
        } catch (err) {
            console.error("Data loading failed:", err);
            if (productGrid) {
                productGrid.innerHTML = `<p style="color:red; text-align:center; width:100%;">Failed to parse product dataset files.</p>`;
            }
        }
    }

    function renderFlexboxGrid() {
        if (!productGrid) return;
        productGrid.innerHTML = '';

        productDataList.forEach((item, idx) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'product-card';
            cardElement.innerHTML = `
                <div class="card-img-holder">
                    <img src="${item.image || './images/barbatos.png'}" alt="${item.name}">
                </div>
                <span class="brand">${item.brand}</span>
                <h4>${item.name}</h4>
                <p style="font-size:0.85rem; opacity:0.7; color:#fff; margin-bottom:10px;">${item.description}</p>
                <p class="product-colors">Colors: ${item.color}</p>
                <div class="price">Php ${parseInt(item.price).toLocaleString()}</div>
                <button class="btn-order" data-array-id="${idx}">Order</button>
            `;
            productGrid.appendChild(cardElement);
        });
    }

    loadJsonCatalog();

    /* ==========================================================================
       LIVE CART SUMMATION WITH INTERACTIVE CONTROLS
       ========================================================================== */
    const cartBtn = document.querySelector('.cart-btn');
    const cartBadge = document.querySelector('.cart-badge');
    const cartModal = document.getElementById('cart-modal');
    const modalClose = document.querySelector('.modal-close');
    const modalItemsContainer = document.getElementById('modal-items-container');
    const modalItemCount = document.getElementById('modal-item-count');
    const modalTotalPrice = document.getElementById('modal-total-price');

    if (productGrid) {
        productGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-order')) {
                const targetedID = e.target.getAttribute('data-array-id');
                const productMatch = productDataList[targetedID];
                
                const existingItem = selectedCartItems.find(item => item.name === productMatch.name);
                
                if (existingItem) {
                    existingItem.quantity += 1;
                } else {
                    selectedCartItems.push({
                        ...productMatch,
                        quantity: 1
                    });
                }
                
                alert(`${productMatch.name} added to cart`);
                updateCartModalView();
            }
        });
    }

    if (modalItemsContainer) {
        modalItemsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-remove-item')) {
                const targetID = parseInt(e.target.getAttribute('data-remove-id'));
                const targetedItem = selectedCartItems[targetID];

                if (targetedItem.quantity > 1) {
                    targetedItem.quantity -= 1;
                } else {
                    selectedCartItems.splice(targetID, 1);
                }

                updateCartModalView();
            }
        });
    }

    function updateCartModalView() {
        const totalItemsCount = selectedCartItems.reduce((acc, currentItem) => acc + currentItem.quantity, 0);

        if (cartBadge) cartBadge.textContent = totalItemsCount;
        if (modalItemCount) modalItemCount.textContent = totalItemsCount;

        const absoluteSumTotal = selectedCartItems.reduce((runningTotal, currentItem) => {
            const itemPriceInteger = parseInt(currentItem.price || 0);
            return runningTotal + (itemPriceInteger * currentItem.quantity);
        }, 0);

        if (modalTotalPrice) {
            modalTotalPrice.textContent = `Php ${absoluteSumTotal.toLocaleString()}`;
        }

        if (!modalItemsContainer) return;
        modalItemsContainer.innerHTML = '';

        if (selectedCartItems.length === 0) {
            modalItemsContainer.innerHTML = `<p style="color:#666; width:100%; text-align:center; padding:20px 0;">No items selected.</p>`;
        } else {
            selectedCartItems.forEach((item, idx) => {
                const row = document.createElement('div');
                row.className = 'modal-item-thumb';
                row.innerHTML = `
                    <img src="${item.image || './images/barbatos.png'}" alt="${item.name}">
                    <div class="thumb-details">
                        <div class="item-info-meta">
                            <h5>${item.name}</h5>
                            <p>Php ${parseInt(item.price).toLocaleString()}</p>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span class="item-qty-badge">Qty: ${item.quantity}</span>
                            <!-- Minus control button passing loop index coordinate data parameter tokens -->
                            <button class="btn-remove-item" data-remove-id="${idx}">&minus;</button>
                        </div>
                    </div>
                `;
                modalItemsContainer.appendChild(row);
            });
        }
    }

    /* ==========================================================================
       TRANSACTION COMPLETION & CLEAR HOOKS
       ========================================================================== */
    if (cartBtn && cartModal && modalClose) {
        cartBtn.addEventListener('click', () => {
            updateCartModalView(); 
            cartModal.classList.add('active');
        });
        modalClose.addEventListener('click', () => cartModal.classList.remove('active'));
        window.addEventListener('click', (e) => {
            if (e.target === cartModal) cartModal.classList.remove('active');
        });

        const clearCartBtn = document.getElementById('btn-clear-cart');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => {
                if (selectedCartItems.length === 0) {
                    alert("Your cart is already empty!");
                    return;
                }
                
                if (confirm("Are you sure you want to clear all items from your cart?")) {
                    selectedCartItems = [];
                    updateCartModalView();
                }
            });
        }

        const checkoutBtn = document.querySelector('.btn-checkout');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                if (selectedCartItems.length === 0) {
                    alert("Your shopping cart is empty! Add some items before checking out.");
                    return;
                }

                alert("Purchase successful! Thank you for ordering with ModKits.");
                selectedCartItems = [];
                updateCartModalView();
                cartModal.classList.remove('active');
            });
        }
    }

    /* ==========================================================================
      STICKY NAVBAR OPACITY TOGGLE ON SCROLL
      ========================================================================== */
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
});