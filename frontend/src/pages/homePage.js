import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Carousel } from "react-bootstrap";
import { Button } from "../components/ui/button";
import wallpaper from "../assets/wallpaper2.png";
import userImage from "../assets/userImage.png";
import wasteImage from "../assets/wasteImg.png";

export default function HomePage({ url }) {
  const navigate = useNavigate();
  const [userCount, setUserCount] = useState(20);
  const [displayCount, setDisplayCount] = useState(0);
  const [displayPlastic, setDisplayPlastic] = useState(0);
  const [displayPaper, setDisplayPaper] = useState(0);
  const [displayMetal, setDisplayMetal] = useState(0);
  const [displayGlass, setDisplayGlass] = useState(0);
  const [displayOrganic, setDisplayOrganic] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [motivationalQuote, setMotivationalQuote] = useState('');
  const [motivationalAuthor, setMotivationalAuthor] = useState('');


  // Waste data
  const plasticWaste = 82; // million tons
  const organicWaste = 1.3 * 1000; // billion to million tons
  const paperWaste = 100; // million tons
  const metalWaste = 177; // million tons
  const glassWaste = 100; // million tons

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch(`${url}/api/users/count`);
        const data = await response.json();
        setUserCount(data.userCount);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    }
    fetchStats();
  }, [url]);

  useEffect(() => {
    async function fetchMotivation() {
      try {
        const res = await fetch(`${url}/api/home/getMotivated`);
        const { quote, author } = await res.json();
        setMotivationalQuote(quote);
        setMotivationalAuthor(author);
      } catch (e) {
        console.error("Failed to fetch motivation:", e);
      }
    }
    fetchMotivation();
  }, [url]);

  // Animate user count on slide 2
  useEffect(() => {
    if (activeIndex === 1 && userCount > 0) {
      let start = 0;
      setDisplayCount(0);
      const duration = 1500;
      const step = 50;
      const inc = Math.ceil(userCount / (duration / step));
      const timer = setInterval(() => {
        start += inc;
        if (start >= userCount) {
          start = userCount;
          clearInterval(timer);
        }
        setDisplayCount(start);
      }, step);
      return () => clearInterval(timer);
    }
  }, [activeIndex, userCount]);

  // Animate waste counts on slide 3
  useEffect(() => {
    if (activeIndex === 2) {
      const items = [
        { value: plasticWaste, setter: setDisplayPlastic },
        { value: paperWaste, setter: setDisplayPaper },
        { value: metalWaste, setter: setDisplayMetal },
        { value: glassWaste, setter: setDisplayGlass },
        { value: organicWaste, setter: setDisplayOrganic }
      ];
      items.forEach(({ value, setter }) => setter(0));
      items.forEach(({ value, setter }) => {
        let start = 0;
        const duration = 1500;
        const step = 50;
        const inc = Math.ceil(value / (duration / step));
        const timer = setInterval(() => {
          start += inc;
          if (start >= value) {
            start = value;
            clearInterval(timer);
          }
          setter(start);
        }, step);
      });
    }
  }, [activeIndex]);

  const captionStyle = {
    position: 'absolute',
    top: '55%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '700px',
    textAlign: 'center',
    padding: '2rem',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    backdropFilter: 'blur(2px)',
    borderRadius: '0.5rem'
  };
  const iconStyle = { filter: 'invert(1)' };

  return (
    <Carousel
      activeIndex={activeIndex}
      onSelect={(idx) => setActiveIndex(idx)}
      fade
      className="vh-100"
      nextIcon={<span aria-hidden="true" className="carousel-control-next-icon" style={iconStyle} />}
      prevIcon={<span aria-hidden="true" className="carousel-control-prev-icon" style={iconStyle} />}
    >
      {/* Slide 1: Intro */}
      <Carousel.Item className="vh-100">
        <img className="d-block w-100 h-100" src={wallpaper} alt="Intro" style={{ objectFit: 'cover' }} />
        <Carousel.Caption style={captionStyle}>
          <h1 className="display-4 text-dark mb-3">Welcome to Our Platform!</h1>
          <p className="lead text-dark mb-4">
            {motivationalQuote
              ? `“${motivationalQuote}” — ${motivationalAuthor}`
              : 'Loading inspiration...'}
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Button onClick={() => navigate('/login')}>Login</Button>
            <Button onClick={() => navigate('/register')}>Register</Button>
          </div>
        </Carousel.Caption>
      </Carousel.Item>

      {/* Slide 2: Users */}
      <Carousel.Item className="vh-100">
        <img className="d-block w-100 h-100" src={userImage} alt="Users" style={{ objectFit: 'cover' }} />
        <Carousel.Caption style={captionStyle}>
          <h2 className="h3 text-dark mb-2">Total Users</h2>
          <p className="display-5 text-dark mb-3">{displayCount}</p>
          <p className="text-dark">Our community grows daily—join thousands making a difference.</p>
        </Carousel.Caption>
      </Carousel.Item>

      {/* Slide 3: Waste */}
      <Carousel.Item className="vh-100">
        <img className="d-block w-100 h-100" src={wasteImage} alt="Waste" style={{ objectFit: 'cover' }} />
        <Carousel.Caption style={captionStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'center', justifyItems: 'center' }}>
            <div>
              <h2 className="h4 text-dark">Plastic Waste</h2>
              <p className="h5 text-dark mb-0">{displayPlastic}M tons</p>
            </div>
            <div>
              <h2 className="h4 text-dark">Paper Waste</h2>
              <p className="h5 text-dark mb-0">{displayPaper}M tons</p>
            </div>
            <div>
              <h2 className="h4 text-dark">Metal Waste</h2>
              <p className="h5 text-dark mb-0">{displayMetal}M tons</p>
            </div>
            <div>
              <h2 className="h4 text-dark">Glass Waste</h2>
              <p className="h5 text-dark mb-0">{displayGlass}M tons</p>
            </div>
            <div style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
              <h2 className="h4 text-dark">Organic Waste</h2>
              <p className="h5 text-dark mb-0">{displayOrganic}M tons</p>
            </div>
          </div>
          <p className="mt-2 text-dark">
            Are produced per year. Be the change—reduce your footprint today!
          </p>
        </Carousel.Caption>
      </Carousel.Item>
    </Carousel>
  );
}
