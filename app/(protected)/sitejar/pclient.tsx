'use client';

import { useAuth } from '@/app/context/AuthContext';

export default function SitejarClient() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="w-full p-4">
        <div className="text-center">
          <p>Please sign in to access Site Voyager.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: '#000000',
        backgroundImage: `
          radial-gradient(1px 1px at 50px 25px, #722F37, transparent),
          radial-gradient(2px 2px at 120px 15px, #808080, transparent),
          radial-gradient(1px 1px at 200px 35px, #FFD700, transparent),
          radial-gradient(2px 2px at 80px 40px, #ADD8E6, transparent),
          radial-gradient(1px 1px at 300px 20px, #722F37, transparent),
          radial-gradient(3px 3px at 180px 10px, #808080, transparent),
          radial-gradient(1px 1px at 400px 45px, #FFD700, transparent),
          radial-gradient(2px 2px at 250px 30px, #ADD8E6, transparent),
          radial-gradient(1px 1px at 500px 15px, #722F37, transparent),
          radial-gradient(2px 2px at 350px 40px, #808080, transparent),
          radial-gradient(4px 4px at 450px 25px, #FFD700, transparent),
          radial-gradient(1px 1px at 600px 35px, #ADD8E6, transparent),
          radial-gradient(2px 2px at 550px 10px, #722F37, transparent),
          radial-gradient(1px 1px at 700px 20px, #808080, transparent),
          radial-gradient(3px 3px at 650px 45px, #FFD700, transparent),
          radial-gradient(1px 1px at 750px 30px, #ADD8E6, transparent),
          radial-gradient(2px 2px at 800px 15px, #722F37, transparent),
          radial-gradient(1px 1px at 900px 40px, #808080, transparent),
          radial-gradient(2px 2px at 850px 25px, #FFD700, transparent),
          radial-gradient(1px 1px at 950px 35px, #ADD8E6, transparent),
          radial-gradient(3px 3px at 1000px 10px, #722F37, transparent),
          radial-gradient(1px 1px at 1100px 45px, #808080, transparent),
          radial-gradient(2px 2px at 1050px 20px, #FFD700, transparent),
          radial-gradient(1px 1px at 1150px 30px, #ADD8E6, transparent),
          radial-gradient(2px 2px at 1200px 15px, #722F37, transparent),
          radial-gradient(1px 1px at 1250px 40px, #808080, transparent),
          radial-gradient(3px 3px at 1300px 25px, #FFD700, transparent),
          radial-gradient(1px 1px at 1350px 35px, #ADD8E6, transparent),
          radial-gradient(2px 2px at 1400px 10px, #722F37, transparent),
          radial-gradient(1px 1px at 30px 10px, #808080, transparent),
          radial-gradient(2px 2px at 150px 50px, #FFD700, transparent),
          radial-gradient(1px 1px at 270px 5px, #ADD8E6, transparent),
          radial-gradient(3px 3px at 380px 15px, #722F37, transparent),
          radial-gradient(1px 1px at 480px 35px, #808080, transparent),
          radial-gradient(2px 2px at 580px 45px, #FFD700, transparent),
          radial-gradient(1px 1px at 680px 5px, #ADD8E6, transparent),
          radial-gradient(2px 2px at 780px 35px, #722F37, transparent),
          radial-gradient(1px 1px at 880px 15px, #808080, transparent),
          radial-gradient(3px 3px at 980px 45px, #FFD700, transparent),
          radial-gradient(1px 1px at 1080px 25px, #ADD8E6, transparent),
          radial-gradient(2px 2px at 1180px 5px, #722F37, transparent),
          radial-gradient(1px 1px at 70px 48px, #FFD700, transparent),
          radial-gradient(2px 2px at 220px 8px, #722F37, transparent),
          radial-gradient(1px 1px at 340px 42px, #808080, transparent),
          radial-gradient(2px 2px at 420px 5px, #ADD8E6, transparent),
          radial-gradient(1px 1px at 570px 28px, #722F37, transparent),
          radial-gradient(3px 3px at 720px 48px, #FFD700, transparent),
          radial-gradient(1px 1px at 820px 8px, #808080, transparent),
          radial-gradient(2px 2px at 920px 32px, #ADD8E6, transparent),
          radial-gradient(1px 1px at 1020px 48px, #722F37, transparent),
          radial-gradient(2px 2px at 1120px 5px, #FFD700, transparent),
          radial-gradient(1px 1px at 1270px 18px, #808080, transparent),
          radial-gradient(3px 3px at 1380px 42px, #ADD8E6, transparent),
          radial-gradient(1px 1px at 160px 28px, #722F37, transparent)
        `,
        backgroundSize: '100% 100%',
        padding: '20px'
      }}
    >
      <div className="mb-6">
        <h1 className="text-white text-3xl font-bold mb-2" style={{ fontSize: '20px' }}>Site Voyager Table</h1>
      </div>
    </div>
  );
}