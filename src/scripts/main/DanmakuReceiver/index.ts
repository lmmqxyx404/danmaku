import { KoeBilibiliDanmaku } from '@/scripts/types/Danmaku'
import { LiveTCP } from 'bilibili-live-ws'
import EventManager from 'electron-vue-event-manager'

import {
  IKoePlugin,
  DanmakuEventType
} from 'D:/Projects/@types-koe-bilibili-danmaku'

export function createDanmakuReceiver(plugins: IKoePlugin[]) {
  const live = new LiveTCP(5316)
  // 建立 WebSocket 连接
  live.on('open', () => console.log('opened'))
  // 连接已确认
  live.on('live', () => {
    // 心跳包
    live.on('heartbeat', (popularity) => {
      console.log(popularity)
      // 人气值
      EventManager.Instance().broadcast<number>(
        DanmakuEventType.PopularityChanged,
        popularity
      )
    })

    // 监听弹幕消息
    live.on('DANMU_MSG', async (data) => {
      const id = `${data.info[9].ct}${data.info[9].ts}`

      const uid = data.info[2][0]

      const sender = data.info[2][1]
      const message = data.info[1]

      let danmaku: KoeBilibiliDanmaku.Danmaku = {
        id,
        uid,
        sender,
        message
      }

      for (let i = 0; i < plugins.length; i++) {
        const plugin = plugins[i]
        danmaku = await plugin.handle(danmaku)
      }

      console.log(`${danmaku.sender}: ${danmaku.message}`)

      EventManager.Instance().broadcast<KoeBilibiliDanmaku.Danmaku>(
        DanmakuEventType.ReceivedDanmaku,
        danmaku
      )
    })
  })
}
