import test from 'node:test'
import assert from 'node:assert/strict'
import {
  discussions,
  createDiscussionPicker,
  type DiscussionTopic,
} from '../src/data/discussions.ts'

test('table dialogue covers four research areas with formulas and no private transcripts', () => {
  assert.equal(discussions.length, 144)
  assert.equal(new Set(discussions.map((entry) => entry.id)).size, 144)
  assert.equal(new Set(discussions.map((entry) => entry.text)).size, 144)
  for (const topic of ['后训练', 'Agent', '具身智能', '推荐系统']) {
    assert.equal(discussions.filter((entry) => entry.topic === topic).length, 32)
  }
  assert.ok(discussions.filter((entry) => entry.code).length >= 20)
  assert.ok(
    discussions.every(
      (entry) => entry.text.length < 80 && !/@[\u4e00-\u9fff]|https?:\/\//.test(entry.text)
    )
  )
})

test('each discussion topic cycles without repeating entries within its shuffle bag', () => {
  const pick = createDiscussionPicker()
  for (const topic of [
    '后训练',
    'Agent',
    '具身智能',
    '推荐系统',
    'Infra',
    '饭桌闲聊',
  ] as DiscussionTopic[]) {
    const size = discussions.filter((entry) => entry.topic === topic).length
    const first = Array.from({ length: size }, () => pick(topic))
    assert.equal(new Set(first.map((entry) => entry.id)).size, size)
    assert.ok(first.every((entry) => entry.topic === topic))
    assert.equal(pick(topic).topic, topic)
  }
})
