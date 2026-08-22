import React, { useState, useEffect } from 'react';
import API from '../services/api';
import UserAvatar from '../components/UserAvatar';
import Loader from '../components/Loader';

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await API.get('/rewards/leaderboard');
        setLeaders(response.data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setLeaders([]);
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) return <Loader loading={true} message="Calculating Global Impact Rankings..." />;

  return (
    <main className="max-w-4xl mx-auto px-6 pt-12 pb-24 relative z-10">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-primary mb-4 uppercase transition-colors">Leaderboard</h1>
        <p className="text-on-surface-variant text-lg">Top contributors driving global impact this month.</p>
        <div className="h-1.5 w-32 bg-primary-container mx-auto mt-6 rounded-full"></div>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4 mb-16 items-end">
        {leaders.slice(0, 3).map((leader, index) => {
          const positions = [
            { pos: 2, height: 'h-48', color: 'bg-[#60efff] text-[#00210c]', order: 'order-1' },
            { pos: 1, height: 'h-64', color: 'bg-[#00ff87] text-[#00210c]', order: 'order-2' },
            { pos: 3, height: 'h-40', color: 'bg-[#ffdb79] text-[#3d2f00]', order: 'order-3' }
          ];
          const style = positions[index === 0 ? 1 : index === 1 ? 0 : 2];
          const podiumLeader = leaders[style.pos - 1];

          if (!podiumLeader) return null;

          return (
            <div key={podiumLeader._id} className={`flex flex-col items-center ${style.order}`}>
              <div className="relative mb-4">
                <UserAvatar 
                  src={podiumLeader.profilePhoto} 
                  name={podiumLeader.name} 
                  size={style.pos === 1 ? 'w-24 h-24' : 'w-20 h-20'}
                  iconSize={style.pos === 1 ? 'text-4xl' : 'text-3xl'}
                />
                <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${style.color} shadow-[0_0_12px_rgba(0,0,0,0.5)] z-10`}>
                  {style.pos}
                </div>
              </div>
              <div className={`w-full ${style.height} glass-container rounded-t-3xl flex flex-col justify-center items-center p-4 border-b-0`}>
                <p className="font-bold text-on-surface text-center text-sm mb-1">{podiumLeader.name ? podiumLeader.name.split(' ')[0] : 'User'}</p>
                <p className="text-primary font-black text-xs">{(podiumLeader.coinBalance || 0).toLocaleString()}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rankings List */}
      <div className="glass-container rounded-[32px] overflow-hidden shadow-2xl">
        <div className="divide-y divide-outline-variant/10">
          {leaders.map((leader, index) => (
            <div key={leader._id} className="p-6 flex items-center justify-between hover:bg-surface-container-high transition-all">
              <div className="flex items-center gap-6">
                <span className={`w-8 text-center font-black text-xl ${index < 3 ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {index + 1}
                </span>
                <div className="flex items-center gap-4">
                  <UserAvatar 
                    src={leader.profilePhoto} 
                    name={leader.name} 
                    size="w-12 h-12"
                    iconSize="text-2xl"
                  />
                  <div>
                    <p className="font-bold text-on-surface">{leader.name}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Impact Score: {leader.impactScore || 0}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-on-surface">{(leader.coinBalance || 0).toLocaleString()}</span>
                <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>toll</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Leaderboard;
