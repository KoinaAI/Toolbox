import { Link } from 'react-router-dom'
import { Card, Chip, Accordion } from '@heroui/react'
import { Icon } from '../components/icon'
import { useApp } from '../lib/providers'

export function AboutPage() {
  const { catalog } = useApp()
  return (
    <article className="about-page">
      <div className="about-eyebrow">
        <img src="/favicon.svg" width="44" height="44" alt="" />
        <Chip size="sm" variant="soft">
          正在生长的工具箱
        </Chip>
      </div>
      <h1>
        名字有点乱，
        <br />
        <span>用起来要顺手。</span>
      </h1>
      <p className="about-lead">
        我们想做一个打开就能找到、用完就能离开的小工具站。
        <br />
        把开发、设计和生活里的零碎需求，认真地放进同一个箱子。
      </p>
      <div className="about-facts">
        <span>
          <strong>{catalog?.categories.length ?? '—'}</strong>个分类
        </span>
        <span>
          <strong>{catalog?.tools.length ?? '—'}</strong>个工具条目
        </span>
        <span>
          <strong>0</strong>个已接入功能
        </span>
      </div>
      <div className="about-grid">
        {[
          {
            icon: 'Grid',
            title: '好找，也好整理',
            text: '按分类探索，用关键词搜索。收藏常用工具，下次少找一会儿。',
          },
          {
            icon: 'Heart',
            title: '少一点打扰',
            text: '无需注册即可浏览目录。没有虚构的使用量，也不把待接入功能当作已上线。',
          },
          {
            icon: 'Layers',
            title: '小步前进，持续生长',
            text: '每个工具都可以独立接入。先把箱子做好，再把真正好用的工具装进来。',
          },
        ].map((item) => (
          <Card key={item.title} className="about-value">
            <Card.Header>
              <span className="about-value-icon">
                <Icon name={item.icon} size={23} />
              </span>
            </Card.Header>
            <Card.Content>
              <Card.Title>{item.title}</Card.Title>
              <Card.Description>{item.text}</Card.Description>
            </Card.Content>
          </Card>
        ))}
      </div>
      <h2>你可能还想知道</h2>
      <Accordion>
        <Accordion.Item id="stage">
          <Accordion.Heading>
            <Accordion.Trigger>
              目前这个版本可以做什么？
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            可以浏览分类与工具、搜索、收藏、查看最近打开记录、切换卡片或列表视图，以及通过
            ⌘ / Ctrl K
            快速查找。实际的转换、计算、生成等功能暂未实现，所有工作区均会明确说明状态。
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item id="data">
          <Accordion.Heading>
            <Accordion.Trigger>
              会保存我的数据吗？
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            当前没有账号系统或云端个人数据。收藏、最近记录、显示方式与主题偏好使用浏览器
            localStorage 保存；请求目录时只访问同源
            API。清理站点数据会一并清除本地偏好。
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item id="open">
          <Accordion.Heading>
            <Accordion.Trigger>
              想参与建设，或者建议一个工具？
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            欢迎到{' '}
            <a
              className="inline-link"
              href="https://github.com/KoinaAI/Toolbox"
              target="_blank"
              rel="noreferrer"
            >
              GitHub 仓库
            </a>
            查看源码或创建 Issue。仓库文档包含目录数据格式与工具模块扩展说明。
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
      <div className="about-actions">
        <Link className="primary-link" to="/">
          打开工具箱
          <Icon name="ArrowRight" size={16} />
        </Link>
        <a
          href="https://github.com/KoinaAI/Toolbox"
          target="_blank"
          rel="noreferrer"
          className="inline-link"
        >
          <Icon name="Github" size={17} />在 GitHub 认识我们
        </a>
      </div>
    </article>
  )
}
