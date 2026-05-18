'use client'
import { subDays, format, eachDayOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'

interface Post { published_at: string }

export default function ActivityHeatmap({ posts }: { posts: Post[] }) {
  const today = new Date()
  const start = subDays(today, 364)
  const days = eachDayOfInterval({ start, end: today })

  const countByDay = new Map<string, number>()
  posts.forEach(p => {
    const key = p.published_at.slice(0, 10)
    countByDay.set(key, (countByDay.get(key) ?? 0) + 1)
  })

  function color(count: number) {
    if (count === 0) return 'bg-muted'
    if (count === 1) return 'bg-pink-200'
    if (count === 2) return 'bg-pink-400'
    return 'bg-pink-600'
  }

  // Group by week columns
  const weeks: Date[][] = []
  let week: Date[] = []
  days.forEach((day, i) => {
    week.push(day)
    if (day.getDay() === 6 || i === days.length - 1) {
      weeks.push(week)
      week = []
    }
  })

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map(day => {
              const key = format(day, 'yyyy-MM-dd')
              const count = countByDay.get(key) ?? 0
              return (
                <div
                  key={key}
                  title={`${format(day, 'd MMM yyyy', { locale: es })}: ${count} publicación(es)`}
                  className={`w-3 h-3 rounded-sm ${color(count)}`}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
        <span>Menos</span>
        <div className="w-3 h-3 rounded-sm bg-muted" />
        <div className="w-3 h-3 rounded-sm bg-pink-200" />
        <div className="w-3 h-3 rounded-sm bg-pink-400" />
        <div className="w-3 h-3 rounded-sm bg-pink-600" />
        <span>Más</span>
      </div>
    </div>
  )
}
