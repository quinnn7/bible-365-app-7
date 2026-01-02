"use client";

import { useState, useEffect } from "react";
import supabase, { isSupabaseConfigured } from "../../../lib/supabaseClient";
import { DEFAULT_AVATAR } from "../../page";

export default function ProfilePage({ params }) {
  const { id } = params;
  const [profile, setProfile] = useState(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [recentFollowers, setRecentFollowers] = useState([]);
  const [followingProfiles, setFollowingProfiles] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const user = sessionData?.session?.user;
          if (user) setCurrentUser(user.id);

          const { data: p } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
          setProfile(p || null);

          const { count: followers } = await supabase.from('follows').select('id', { count: 'exact', head: true }).eq('followee_id', id);
          setFollowerCount(followers || 0);
          const { count: following } = await supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', id);
          setFollowingCount(following || 0);

          const { data: recent } = await supabase.from('follows').select('follower_id, created_at').eq('followee_id', id).order('created_at', { ascending: false }).limit(10);
          const followerIds = (recent || []).map(r => r.follower_id);
          if (followerIds.length > 0) {
            const { data: followerProfiles } = await supabase.from('profiles').select('id, username, avatar_url').in('id', followerIds);
            setRecentFollowers(followerProfiles || []);
          }

          // fetch users this profile is following
          const { data: followingRows } = await supabase.from('follows').select('followee_id, created_at').eq('follower_id', id).order('created_at', { ascending: false }).limit(50);
          const followingIds = (followingRows || []).map(r => r.followee_id);
          if (followingIds.length > 0) {
            const { data: followingProfilesData } = await supabase.from('profiles').select('id, username, avatar_url').in('id', followingIds);
            setFollowingProfiles(followingProfilesData || []);
          }

          if (user) {
            const { data: rel } = await supabase.from('follows').select('id').match({ follower_id: user.id, followee_id: id }).maybeSingle();
            setIsFollowing(!!rel);
          }
        } catch (err) { console.error('profile load failed', err); }
        setLoading(false);
        return;
      }

      // fallback localStorage
      try {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        setProfile(users[id] ? { id, username: id, avatar_url: users[id].avatar, description: users[id].description } : null);
        const follows = JSON.parse(localStorage.getItem('follows') || '{}');
        let fcount = 0, gcount = 0;
        Object.keys(follows).forEach(f => {
          (follows[f] || []).forEach(t => { if (t === id) fcount += 1; if (f === id) gcount += 1; });
        });
        setFollowerCount(fcount);
        setFollowingCount(gcount);
        const list = [];
        Object.keys(follows).forEach(f => { (follows[f] || []).forEach(t => { if (t === id && users[f]) list.push({ id: f, username: f, avatar_url: users[f].avatar }); }); });
        setRecentFollowers(list.slice(0,10));

        // following list (who this profile follows)
        const followingList = (follows[id] || []).map(fid => users[fid] ? { id: fid, username: fid, avatar_url: users[fid].avatar } : { id: fid, username: fid });
        setFollowingProfiles(followingList);
        const current = localStorage.getItem('currentUser');
        setCurrentUser(current);
        setIsFollowing((follows[current] || []).includes(id));
      } catch (err) { console.error(err); }
      setLoading(false);
    })();
  }, [id]);

  const follow = async () => {
    if (!currentUser) { alert('Log in to follow users'); return; }
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.from('follows').insert({ follower_id: currentUser, followee_id: id });
      } else {
        const all = JSON.parse(localStorage.getItem('follows') || '{}');
        all[currentUser] = all[currentUser] || [];
        if (!all[currentUser].includes(id)) all[currentUser].push(id);
        localStorage.setItem('follows', JSON.stringify(all));
      }
      setIsFollowing(true);
      setFollowerCount(c => c + 1);
    } catch (err) { console.error('follow failed', err); }
  };

  const unfollow = async () => {
    if (!currentUser) { alert('Log in to unfollow users'); return; }
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.from('follows').delete().match({ follower_id: currentUser, followee_id: id });
      } else {
        const all = JSON.parse(localStorage.getItem('follows') || '{}');
        all[currentUser] = (all[currentUser] || []).filter(x => x !== id);
        localStorage.setItem('follows', JSON.stringify(all));
      }
      setIsFollowing(false);
      setFollowerCount(c => Math.max(0, c - 1));
    } catch (err) { console.error('unfollow failed', err); }
  };

  if (loading) return <div style={{ padding:20 }}>Loading...</div>;
  if (!profile) return <div style={{ padding:20 }}>Profile not found</div>;

  return (
    <div style={{ padding:24 }}>
      <div style={{ display:'flex', gap:16, alignItems:'center' }}>
        <div style={{ width:120, height:120, borderRadius:12, overflow:'hidden' }}>
          <img src={profile.avatar_url || DEFAULT_AVATAR} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        </div>
        <div>
          <h2 style={{ margin:0 }}>{profile.username || profile.id}</h2>
          <div style={{ color:'#666', marginTop:6 }}>{profile.description || ''}</div>
          <div style={{ marginTop:12, display:'flex', gap:8 }}>
            <div style={{ fontWeight:700 }}>{followerCount}</div>
            <div style={{ color:'#666' }}>Followers</div>
            <div style={{ marginLeft:12, fontWeight:700 }}>{followingCount}</div>
            <div style={{ color:'#666' }}>Following</div>
          </div>
        </div>
        <div style={{ marginLeft:'auto' }}>
          {isFollowing ? <button onClick={unfollow} style={{ background:'#EEE' }}>Unfollow</button> : <button onClick={follow} style={{ background:'#6B3E26', color:'#FBF7F2' }}>Follow</button>}
        </div>
      </div>

      {recentFollowers.length > 0 && (
        <div style={{ marginTop:20 }}>
          <h4>Recent followers</h4>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {recentFollowers.map(f => (
              <div key={f.id} style={{ width:120, padding:8, border:'1px solid #EEE', borderRadius:8 }}>
                <div style={{ width:56, height:56, borderRadius:8, overflow:'hidden', marginBottom:6 }}>
                  <img src={f.avatar_url || DEFAULT_AVATAR} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                </div>
                <div style={{ fontWeight:700 }}>{f.username || f.id}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {followingProfiles.length > 0 && (
        <div style={{ marginTop:20 }}>
          <h4>Following</h4>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {followingProfiles.map(f => (
              <a key={f.id} href={`/profile/${f.id}`} style={{ width:120, padding:8, border:'1px solid #EEE', borderRadius:8, textDecoration:'none', color:'inherit' }}>
                <div style={{ width:56, height:56, borderRadius:8, overflow:'hidden', marginBottom:6 }}>
                  <img src={f.avatar_url || DEFAULT_AVATAR} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                </div>
                <div style={{ fontWeight:700 }}>{f.username || f.id}</div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
