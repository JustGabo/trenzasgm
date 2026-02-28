import TrenzasHero from "./hero";
import Navbar from "./navbar";
import Services from "./services";
import Works from "./works";
import HowWeWork from "./how-we-work";
import Appointment from "./appointment";
import Footer from "./footer";

const MainContent = () => {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Navbar />
            <div className="relative flex items-center  h-screen pt-14 mb-40 md:mb-0">
                <TrenzasHero />
            </div>
            <HowWeWork />
            <Services />
            {/* <Works /> */}
            <Appointment />
            <Footer />
        </div>
    );
};

export default MainContent;
