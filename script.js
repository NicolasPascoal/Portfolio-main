



const elements = document.querySelectorAll('.animate');









const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.classList.add('show');
    }
  });
}, {
  threshold: 0.2 
});

elements.forEach(el => observer.observe(el));


let lastScroll = 0;
const header = document.querySelector('header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > lastScroll && currentScroll > 100) {
      
        header.style.top = '-120px';
    } else {
        header.style.top = '0';
    }

    lastScroll = currentScroll;
});