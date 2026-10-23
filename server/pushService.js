/**
 * 多平台消息推送服务
 * 支持: 飞书 (Feishu)、企业微信 (WeCom)、Telegram、PushMe
 */

class PushService {
  /**
   * 发送飞书机器人消息
   * @param {string} webhookUrl 飞书自定义机器人 Webhook URL
   * @param {object} message 统一消息体 { title, content, theme }
   */
  async sendFeishu(webhookUrl, { title, content, theme }) {
    if (!webhookUrl) throw new Error('飞书 Webhook 地址未配置');
    
    // 飞书卡片颜色映射: blue/green/orange/red
    const templateMap = {
      info: 'blue',
      success: 'green',
      warning: 'orange',
      failure: 'red'
    };
    const cardTemplate = templateMap[theme] || 'blue';

    const payload = {
      msg_type: 'interactive',
      card: {
        config: { wide_screen_mode: true },
        header: {
          title: { tag: 'plain_text', content: title || 'StudyPlan 任务通知' },
          template: cardTemplate
        },
        elements: [
          {
            tag: 'div',
            text: {
              tag: 'lark_md',
              content: content.replace(/\n/g, '\n\n')
            }
          },
          {
            tag: 'hr'
          },
          {
            tag: 'note',
            elements: [
              {
                tag: 'plain_text',
                content: `来自 StudyPlan 小朋友任务规划系统 · ${new Date().toLocaleTimeString('zh-CN', { hour12: false })}`
              }
            ]
          }
        ]
      }
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.code !== 0 && data.StatusCode !== 0) {
      throw new Error(`飞书推送失败: ${data.msg || data.message || JSON.stringify(data)}`);
    }
    return { success: true };
  }

  /**
   * 发送企业微信机器人消息
   * @param {string} webhookUrl 企业微信机器人 Webhook URL
   * @param {object} message 统一消息体 { title, content, theme }
   */
  async sendWeCom(webhookUrl, { title, content }) {
    if (!webhookUrl) throw new Error('企业微信 Webhook 地址未配置');

    // 企业微信支持 markdown
    const mdContent = `### ${title}\n\n${content}\n\n> 来自 StudyPlan · ${new Date().toLocaleTimeString('zh-CN', { hour12: false })}`;

    const payload = {
      msgtype: 'markdown',
      markdown: {
        content: mdContent
      }
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.errcode !== 0) {
      throw new Error(`企业微信推送失败: ${data.errmsg}`);
    }
    return { success: true };
  }

  /**
   * 发送 Telegram 机器人消息
   * @param {object} tgConfig { botToken, chatId, proxyUrl }
   * @param {object} message 统一消息体 { title, content }
   */
  async sendTelegram({ botToken, chatId, proxyUrl }, { title, content }) {
    if (!botToken || !chatId) throw new Error('Telegram BotToken 或 ChatId 未配置');

    const text = `*${title}*\n\n${content}\n\n_来自 StudyPlan · ${new Date().toLocaleTimeString('zh-CN', { hour12: false })}_`;

    let baseUrl = 'https://api.telegram.org';
    if (proxyUrl) {
      baseUrl = proxyUrl.replace(/\/+$/, '');
    }

    const url = `${baseUrl}/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
      })
    });

    const data = await res.json();
    if (!data.ok) {
      throw new Error(`Telegram 推送失败: ${data.description || '未知错误'}`);
    }
    return { success: true };
  }

  /**
   * 发送 PushMe 消息
   * @param {string} pushKey 
   * @param {object} message 
   */
  async sendPushMe(pushKey, { title, content, type = 'markdown' }) {
    if (!pushKey) throw new Error('PushMe push_key 未配置');

    const params = new URLSearchParams({
      push_key: pushKey,
      title: title,
      content: content,
      type: type
    });

    const res = await fetch('https://push.i-i.me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    const result = await res.text();
    if (result !== 'success') {
      throw new Error(`PushMe 推送失败: ${result}`);
    }
    return { success: true };
  }

  /**
   * 单通道连通性测试
   */
  async testChannel(channel, config) {
    const testMsg = {
      title: '🧪 StudyPlan 通道连通性测试',
      content: `这是一条来自 StudyPlan 的测试推送，代表当前通道配置正确并已生效！\n\n发送时间: ${new Date().toLocaleString('zh-CN')}`,
      theme: 'info'
    };

    switch (channel) {
      case 'feishu':
        return await this.sendFeishu(config.webhookUrl, testMsg);
      case 'wecom':
        return await this.sendWeCom(config.webhookUrl, testMsg);
      case 'telegram':
        return await this.sendTelegram(config, testMsg);
      case 'pushme':
        return await this.sendPushMe(config.pushKey, testMsg);
      default:
        throw new Error(`不支持的通道类型: ${channel}`);
    }
  }

  /**
   * 多通道并发分发
   * @param {object} channelsConfig 用户的 channels 配置
   * @param {object} message { title, content, theme }
   */
  async dispatch(channelsConfig, message) {
    if (!channelsConfig) return { success: false, error: '未提供推送配置' };

    const tasks = [];
    const results = {};

    // 飞书
    if (channelsConfig.feishu?.enabled && channelsConfig.feishu?.webhookUrl) {
      tasks.push(
        this.sendFeishu(channelsConfig.feishu.webhookUrl, message)
          .then(() => { results.feishu = { success: true }; })
          .catch(err => { results.feishu = { success: false, error: err.message }; })
      );
    }

    // 企微
    if (channelsConfig.wecom?.enabled && channelsConfig.wecom?.webhookUrl) {
      tasks.push(
        this.sendWeCom(channelsConfig.wecom.webhookUrl, message)
          .then(() => { results.wecom = { success: true }; })
          .catch(err => { results.wecom = { success: false, error: err.message }; })
      );
    }

    // Telegram
    if (channelsConfig.telegram?.enabled && channelsConfig.telegram?.botToken && channelsConfig.telegram?.chatId) {
      tasks.push(
        this.sendTelegram(channelsConfig.telegram, message)
          .then(() => { results.telegram = { success: true }; })
          .catch(err => { results.telegram = { success: false, error: err.message }; })
      );
    }

    // PushMe
    if (channelsConfig.pushme?.enabled && channelsConfig.pushme?.pushKey) {
      tasks.push(
        this.sendPushMe(channelsConfig.pushme.pushKey, message)
          .then(() => { results.pushme = { success: true }; })
          .catch(err => { results.pushme = { success: false, error: err.message }; })
      );
    }

    if (tasks.length === 0) {
      return { success: true, message: '无启用的推送通道', results: {} };
    }

    await Promise.all(tasks);
    const hasSuccess = Object.values(results).some(r => r.success);

    return {
      success: hasSuccess,
      results
    };
  }
}

module.exports = new PushService();
