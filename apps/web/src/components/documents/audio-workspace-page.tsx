'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Maximize2,
  BookOpen,
  Brain,
  MessageSquare,
  User,
  Tag,
  MapPin,
  Building,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  AudioLines,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface TranscriptLine {
  id: number
  timestamp: string
  text: string
  speaker?: string
}

interface Entity {
  name: string
  type: 'person' | 'concept' | 'place' | 'organization' | 'term'
}

const transcriptLines: TranscriptLine[] = [
  {
    id: 1,
    timestamp: '00:00',
    speaker: 'Prof. Chen',
    text: 'Today we\'re going to talk about data structures, specifically hash tables and how they handle collisions in practice.',
  },
  {
    id: 2,
    timestamp: '00:32',
    speaker: 'Prof. Chen',
    text: 'A hash table is a data structure that implements an associative array, mapping keys to values using a hash function.',
  },
  {
    id: 3,
    timestamp: '01:05',
    speaker: 'Prof. Chen',
    text: 'The key insight is that a good hash function distributes keys uniformly across the array, minimizing collisions.',
  },
  {
    id: 4,
    timestamp: '01:48',
    speaker: 'Prof. Chen',
    text: 'When two keys hash to the same index, we call it a collision. There are two main strategies: chaining and open addressing.',
  },
  {
    id: 5,
    timestamp: '02:24',
    speaker: 'Prof. Chen',
    text: 'With separate chaining, each bucket contains a linked list. New entries with the same hash are simply appended to the list.',
  },
  {
    id: 6,
    timestamp: '03:10',
    speaker: 'Prof. Chen',
    text: 'Open addressing, on the other hand, probes for the next available slot. Linear probing checks sequentially, while quadratic probing uses a quadratic function.',
  },
  {
    id: 7,
    timestamp: '03:55',
    speaker: 'Student',
    text: 'Professor, when should we prefer one strategy over the other?',
  },
  {
    id: 8,
    timestamp: '04:12',
    speaker: 'Prof. Chen',
    text: 'Great question. Chaining is simpler and handles high load factors better, but open addressing has better cache performance due to data locality.',
  },
  {
    id: 9,
    timestamp: '05:01',
    speaker: 'Prof. Chen',
    text: 'The load factor, alpha, is the ratio of entries to buckets. When alpha exceeds 0.75, most implementations trigger a resize operation.',
  },
  {
    id: 10,
    timestamp: '05:48',
    speaker: 'Prof. Chen',
    text: 'Resizing involves creating a new array, typically double the size, and rehashing all existing entries. This is O(n) but amortized O(1) per insertion.',
  },
]

const entities: Record<string, Entity[]> = {
  concepts: [
    { name: 'Hash Table', type: 'concept' },
    { name: 'Collision', type: 'concept' },
    { name: 'Chaining', type: 'concept' },
    { name: 'Open Addressing', type: 'concept' },
    { name: 'Linear Probing', type: 'concept' },
    { name: 'Load Factor', type: 'concept' },
    { name: 'Amortized Analysis', type: 'concept' },
  ],
  people: [
    { name: 'Prof. Chen', type: 'person' },
  ],
  terms: [
    { name: 'O(log n)', type: 'term' },
    { name: 'O(n)', type: 'term' },
    { name: 'O(1) amortized', type: 'term' },
    { name: 'α = 0.75', type: 'term' },
  ],
}


export default function AudioWorkspacePage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(142) // 2:22
  const [activeLine, setActiveLine] = useState(4)
  const [insightsExpanded, setInsightsExpanded] = useState(true)
  const totalDuration = 4515 // 1:15:15

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const progressPercent = (currentTime / totalDuration) * 100

  return (
    <div className="flex h-full flex-col overflow-x-hidden bg-zinc-50">
      {/* Top header */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100">
            <AudioLines className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-zinc-900">
              Lecture 12 - Recursion & Data Structures
            </h1>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Badge variant="secondary" className="text-[10px]">CS 101</Badge>
              <span>1h 15m</span>
              <span>•</span>
              <span>audio/mp3</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Sparkles className="h-3 w-3" />
            <span className="hidden sm:inline">AI Summary</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Layers className="h-3 w-3" />
            <span className="hidden sm:inline">Flashcards</span>
          </Button>
        </div>
      </div>

      {/* Main content: 3-column layout */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Left: Audio Player + Waveform */}
        <div className="flex w-full lg:w-[340px] max-h-[300px] lg:max-h-none flex-col border-b lg:border-b-0 lg:border-r border-zinc-200 bg-white">
          {/* Player visualization */}
          <div className="flex flex-1 flex-col items-center justify-center bg-zinc-800 p-6">
            <div className="relative mb-6">
              <motion.div
                className="absolute inset-0 rounded-full bg-purple-500/20"
                animate={isPlaying ? { scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-zinc-800 ring-2 ring-purple-500/30">
                <AudioLines className="h-10 w-10 text-purple-400" />
              </div>
            </div>

            <p className="mb-1 text-sm font-medium text-white">Lecture 12</p>
            <p className="mb-4 text-xs text-zinc-400">Prof. Chen • CS 101</p>

            {/* Playback controls */}
            <div className="flex items-center gap-4">
              <button className="text-zinc-400 hover:text-white transition-colors">
                <SkipBack className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white hover:bg-purple-500 transition-colors"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
              </button>
              <button className="text-zinc-400 hover:text-white transition-colors">
                <SkipForward className="h-4 w-4" />
              </button>
            </div>

            {/* Time + progress */}
            <div className="mt-4 w-full px-2">
              <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(totalDuration)}</span>
              </div>
              <div className="h-1 w-full rounded-full bg-zinc-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Volume */}
            <div className="mt-3 flex items-center gap-2 text-zinc-400">
              <Volume2 className="h-3 w-3" />
              <div className="h-1 w-16 rounded-full bg-zinc-700">
                <div className="h-full w-3/4 rounded-full bg-zinc-400" />
              </div>
            </div>
          </div>

          {/* Waveform strip */}
          <div className="border-t border-zinc-200 bg-zinc-50 px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <AudioLines className="h-3 w-3 text-zinc-400" />
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Waveform</span>
            </div>
            <div className="flex h-8 items-end gap-[1px]">
              {Array.from({ length: 80 }).map((_, i) => {
                const height = Math.random() * 100
                const isActive = i < (progressPercent / 100) * 80
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-colors ${
                      isActive ? 'bg-purple-500' : 'bg-zinc-300'
                    }`}
                    style={{ height: `${Math.max(15, height)}%` }}
                  />
                )
              })}
            </div>
          </div>

          {/* Speaker info */}
          <div className="border-t border-zinc-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-3 w-3 text-zinc-400" />
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Speakers</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-[10px] font-medium text-indigo-600">PC</span>
                </div>
                <span className="text-xs text-zinc-700">Prof. Chen</span>
                <span className="ml-auto text-[10px] text-zinc-400">92%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-[10px] font-medium text-emerald-600">S1</span>
                </div>
                <span className="text-xs text-zinc-700">Student</span>
                <span className="ml-auto text-[10px] text-zinc-400">8%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Transcript */}
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-700">Transcript</span>
              <Badge variant="secondary" className="text-[10px]">{transcriptLines.length} segments</Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="text-xs h-7">
                <Clock className="h-3 w-3 mr-1" />
                Jump to time
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 bg-white">
            <div className="p-6 space-y-1">
              {transcriptLines.map((line) => (
                <motion.div
                  key={line.id}
                  className={`group flex gap-4 rounded-lg px-4 py-3 transition-colors cursor-pointer ${
                    activeLine === line.id
                      ? 'bg-purple-50 border border-purple-200'
                      : 'hover:bg-zinc-50 border border-transparent'
                  }`}
                  onClick={() => setActiveLine(line.id)}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: line.id * 0.03 }}
                >
                  <div className="flex flex-col items-center pt-0.5">
                    <span className="text-[10px] font-mono text-zinc-400 whitespace-nowrap">
                      {line.timestamp}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {line.speaker && (
                      <span className={`text-[11px] font-semibold ${
                        line.speaker === 'Prof. Chen' ? 'text-indigo-600' : 'text-emerald-600'
                      }`}>
                        {line.speaker}
                      </span>
                    )}
                    <p className="text-sm text-zinc-700 leading-relaxed mt-0.5">
                      {line.text}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right: Insights panel */}
        <div className="w-full lg:w-[360px] border-t lg:border-t-0 lg:border-l border-zinc-200 bg-white flex flex-col">
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-zinc-700">AI Insights</span>
            </div>
            <button
              onClick={() => setInsightsExpanded(!insightsExpanded)}
              className="text-zinc-400 hover:text-zinc-600"
            >
              {insightsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-5 space-y-6">
              {/* AI-Generated Summary - prominent at top */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                  AI Summary
                </h3>
                <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4 space-y-3">
                  <p className="text-sm text-zinc-700 leading-relaxed">
                    This lecture covers <span className="font-semibold text-zinc-900">hash table collision resolution</span> strategies,
                    comparing separate chaining and open addressing approaches with their performance trade-offs.
                  </p>
                  <ul className="text-sm text-zinc-600 space-y-2 pl-4">
                    <li className="relative before:absolute before:left-[-12px] before:top-[9px] before:h-1.5 before:w-1.5 before:rounded-full before:bg-purple-400">
                      <span className="font-medium text-zinc-800">Separate chaining</span> — each bucket contains a linked list; simpler to implement and handles high load factors well
                    </li>
                    <li className="relative before:absolute before:left-[-12px] before:top-[9px] before:h-1.5 before:w-1.5 before:rounded-full before:bg-purple-400">
                      <span className="font-medium text-zinc-800">Open addressing</span> — probes for next slot using linear or quadratic functions; better cache performance due to data locality
                    </li>
                    <li className="relative before:absolute before:left-[-12px] before:top-[9px] before:h-1.5 before:w-1.5 before:rounded-full before:bg-purple-400">
                      <span className="font-medium text-zinc-800">Load factor threshold</span> — resize when α exceeds 0.75 (Java HashMap default)
                    </li>
                    <li className="relative before:absolute before:left-[-12px] before:top-[9px] before:h-1.5 before:w-1.5 before:rounded-full before:bg-purple-400">
                      <span className="font-medium text-zinc-800">Resizing cost</span> — O(n) per resize but amortized O(1) per insertion over time
                    </li>
                  </ul>
                  <p className="text-xs text-zinc-500 pt-1 border-t border-zinc-200 mt-3">
                    Key takeaway: Choose chaining for simplicity and high load tolerance; choose open addressing when cache performance matters.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Semantic Entities */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                  Semantic Entities ({Object.values(entities).flat().length})
                </h3>

                <div className="space-y-3">
                  {/* Concepts */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <BookOpen className="h-3 w-3 text-blue-500" />
                      <span className="text-[11px] font-medium text-zinc-600">
                        Concepts ({entities.concepts.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {entities.concepts.map((e) => (
                        <Badge
                          key={e.name}
                          variant="secondary"
                          className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 cursor-pointer"
                        >
                          {e.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* People */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <User className="h-3 w-3 text-purple-500" />
                      <span className="text-[11px] font-medium text-zinc-600">
                        People ({entities.people.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {entities.people.map((e) => (
                        <Badge
                          key={e.name}
                          variant="secondary"
                          className="text-[10px] bg-purple-50 text-purple-700 border-purple-200"
                        >
                          {e.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Technical Terms */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Tag className="h-3 w-3 text-purple-500" />
                      <span className="text-[11px] font-medium text-zinc-600">
                        Technical Terms ({entities.terms.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {entities.terms.map((e) => (
                        <Badge
                          key={e.name}
                          variant="secondary"
                          className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 font-mono"
                        >
                          {e.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Quick Actions */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="text-[11px] h-8 justify-start">
                    <Layers className="h-3 w-3 mr-1.5" />
                    Flashcards
                  </Button>
                  <Button variant="outline" size="sm" className="text-[11px] h-8 justify-start">
                    <Brain className="h-3 w-3 mr-1.5" />
                    Quiz Me
                  </Button>
                  <Button variant="outline" size="sm" className="text-[11px] h-8 justify-start col-span-2">
                    <Sparkles className="h-3 w-3 mr-1.5" />
                    Ask AI about this lecture
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
