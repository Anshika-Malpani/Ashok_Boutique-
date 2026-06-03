import "./home.css";
import "./res.css";
import { NavLink } from "react-router-dom";
import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Navbar from "../components/Navbar";
import { ArrowDown } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  const headingRef = useRef(null);
  const [activeImage, setActiveImage] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  

  const isLaptopScreen = () => window.innerWidth > 768;

  const items = [
    {
      title: "Elegance Era",
      type: "BLOUSES",
      price: "₹500",
      img: " home_images/blouse.jpeg"
    },
    {
      title: "Ethnic Essence",
      type: "KURTIS",
      price: "₹700",
      img: " home_images/Kurti.jpg",
    },
    {
      title: "Occasion Outfits",
      type: "LEHENGA",
      price: "₹1500",
      img: " home_images/Lehenga.jpeg",
    },
    {
      title: "Fusion Fashion",
      type: "INDO WESTERN",
      price: "₹1500-2000",
      img: " home_images/indo.jpeg",
    },
    {
      title: "Trendy Threads",
      type: "CORSETS",
      price: "₹1500",
      img: " home_images/corset.avif",
    },
    {
      title: "Dressing Delight",
      type: "GOWN",
      price: "₹1500",
      img: " home_images/gown.webp",
    },
  ];

  useEffect(() => {
    function typeWriter(textElement, text, speed) {
      let i = 0;

      function type() {
        if (i < text.length) {
          textElement.innerHTML += text.charAt(i);
          i++;
          setTimeout(type, speed);
        }
      }

      type();
    }

    if (headingRef.current) {
      typeWriter(headingRef.current, "Ashok Boutique", 100);
    }
  }, []);

  useEffect(() => {

    const tl = gsap.timeline();

    tl.from("#logo", {
      y: -80,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
    })
    .from(".list li", {
      y: -80,
      opacity: 0,
      stagger: 0.1,
      duration: 0.6,
      ease: "power3.out",
    }, "-=0.5")
    .from(".nav-right", {
      y: -80,
      opacity: 0,
      duration: 0.6,
      ease: "power3.out",
    }, "-=0.5")

    // Hero content
    
    // Scroll indicator bounce
    .from("h5", {
      scale: 0,
      opacity: 0,
      duration: 0.5,
    })
    .to("h5", {
      y: 20,
      repeat: -1,
      yoyo: true,
      duration: 0.6,
      ease: "power1.inOut",
    });

    // 🎯 SCROLL ANIMATIONS (clean & premium)

    gsap.from(".fleftelem", {
      y: 80,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".fleftelem",
        start: "top 80%",
      },
    });
    gsap.from(".elem", {
      y: 100,
      opacity: 0,
      stagger: 0.15,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".heading-page3",
        start: "top 75%",
      },
    });


    gsap.from(".images-list", {
      scale: 0.9,
      opacity: 0,
      duration: 1.2,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".images-list",
        start: "top 85%",
      },
    });

    

    

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };

  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // your animations here
    });
  
    return () => ctx.revert(); // 🔥 important
  }, []);

  return (

     <div className="main">
       <Navbar />
      <div className="main">
        <section className="hero">
          <div className="left">
            <div className="content">
              <h1 className="heading" ref={headingRef}></h1>
              <h3 className="tagline font-extrabold">Elevate Your Everyday with Our Timeless Designs</h3>
              <button className="btn"><NavLink to="/designs">Explore Now</NavLink></button>
            </div>
          </div>
          <div className="right">
            <img src={" home_images/giphy (1).gif"} alt="Boutique preview" />
          </div>
          <h5 className="font-extrabold flex items-center gap-2">
            Scroll Down
           <ArrowDown size={20}strokeWidth={4} />
          </h5>
        </section>

        <div className="fimages">
          <div className="fleft">
            <div className="fleftelem">
              <h3>Custom Couture</h3>
              <h1>
                Tailor-Made Designs: <span>Your Style, Your Fit</span>
              </h1>
            </div>
          </div>
          <div className="fright">
            <div className="images">
              <div className="images-list">
                <img
                  src="https://images.lifestyleasia.com/wp-content/uploads/sites/7/2020/02/13212813/taruntahiliani_69611187_163479404888817_3327583461481998295_n.jpg"
                  alt="Custom couture design"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="elems  font-extrabold relative"
        onMouseEnter={() => isLaptopScreen() && setShowPreview(true)}
       onMouseLeave={() => isLaptopScreen() && setShowPreview(false)}
    >
        <h1 className="heading-page3">FEATURED COLLECTION</h1>
      
      {/* 🔥 Floating Image Preview */}
      
        <div
          className="fixedimg"
          style={{
           opacity: showPreview ? 1 : 0,
            backgroundImage: `url(${activeImage})`,
          }}
        ></div>
    
       

     <div className="elems"></div>
      {items.map((item, index) => (
        <div
          key={index}
          className="elem"
          onMouseEnter={() => isLaptopScreen() && setActiveImage(item.img)}
        >
          <div className="elemup"></div>

          <div className="elemdets">
            
            

            <h1>{item.title}</h1>

            <div className="rightelem">
              <h3>{item.type}</h3>
              <h3>Starting stitching price: {item.price}</h3>
            </div>
          </div>
        </div>
      ))}
    </div>

        <div className="page4">
          <div className="page4-head font-extrabold">
            <h1>Meet The Owner</h1>
            <button className="btn">Know More</button>
          </div>
          <div className="describe">
            <img className="owner" src={" home_images/owner.webp"} alt="Owner" />
            <h3>Sushila Malpani & Ashok Malpani</h3>
            <h6>Owner | Ashok Boutique</h6>
            <div className="achieve">
              <h4>15+ Years Of Experience</h4>
              <h4>Master In Blouse Designs</h4>
              <h4>10+ Years Of Boutique Journey</h4>
            </div>
          </div>
        </div>
        
        <div className="footer">
          <div className="box1">
            <img src="home_images/logo-transparent-png.webp" alt="logo" />
            <p>Elevate Your Everyday with Our Timeless Designs</p>
          </div>
          <div className="box2">
            <div className="nav-items">
              <h3>Menu</h3>
              <h4><a href="../index.html">Home</a></h4>
              <h4><a href="../Blouse/blouse.html">Blouses</a></h4>
              <h4><a href="/Kurti/kurti.html">Kurtis</a></h4>
              <h4><a href="/Lehnga Design/lehnga.html">Lehnga</a></h4>
              <h4><a href="../Indo Western/indo.html">Western</a></h4>
              <h4><a href="../Contact/contact.html">Contact Us</a></h4>
            </div>
          </div>
          <div className="box3">
            <div className="nav-items">
              <h3>Services</h3>
              <h4>Privacy Policy</h4>
              <h4>Terms Of Use</h4>
              <h4>Refund & Cancellation Policy</h4>
            </div>
          </div>
          <div className="box4">
            <div className="nav-items">
              <h3>Get In Touch</h3>
              <h4>Email: asushilamalpani@gmail.com</h4>
            </div>
          </div>
        </div>
        <div className="copyright">
          <h3>Copyright © 2023 Sorting Code Help Technologies Pvt Ltd. All Rights Reserved.</h3>
        </div>
      </div>
     </div>
    
  );
}

export default Home;