
import { CalendarEvent, User } from "../types";

// 模拟后端延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 这是一个模拟后端 API 的服务层。
 * 当你准备好真正的 Node.js 或 Python 后端时，
 * 只需要将这里的 fetch 替换为真实的 URL 即可。
 */
export const apiService = {
  // 用户鉴权
  async login(username: string): Promise<User> {
    await delay(1000);
    const user: User = {
      id: 'u1',
      username,
      email: `${username}@example.com`,
      isPremium: true
    };
    localStorage.setItem('lumina_user', JSON.stringify(user));
    return user;
  },

  async logout() {
    await delay(500);
    localStorage.removeItem('lumina_user');
  },

  // 获取所有计划 (模拟从 MongoDB/PostgreSQL 读取)
  async fetchEvents(userId: string): Promise<CalendarEvent[]> {
    await delay(800);
    const saved = localStorage.getItem('calendar_events');
    return saved ? JSON.parse(saved) : [];
  },

  // 同步/保存计划 (模拟写入数据库)
  async syncEvent(event: CalendarEvent): Promise<boolean> {
    await delay(400); // 模拟网络往返
    const saved = localStorage.getItem('calendar_events');
    const events: CalendarEvent[] = saved ? JSON.parse(saved) : [];
    
    const index = events.findIndex(e => e.id === event.id);
    if (index > -1) {
      events[index] = event;
    } else {
      events.push(event);
    }
    
    localStorage.setItem('calendar_events', JSON.stringify(events));
    return true;
  },

  // 删除计划
  async deleteEvent(eventId: string): Promise<boolean> {
    await delay(300);
    const saved = localStorage.getItem('calendar_events');
    const events: CalendarEvent[] = saved ? JSON.parse(saved) : [];
    const filtered = events.filter(e => e.id !== eventId);
    localStorage.setItem('calendar_events', JSON.stringify(filtered));
    return true;
  }
};
