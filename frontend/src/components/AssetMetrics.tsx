import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';

const featureData = [
    { subject: 'Quality', A: 120, fullMark: 150 },
    { subject: 'Uniqueness', A: 98, fullMark: 150 },
    { subject: 'Volume', A: 86, fullMark: 150 },
    { subject: 'Velocity', A: 99, fullMark: 150 },
    { subject: 'Variety', A: 85, fullMark: 150 },
    { subject: 'Veracity', A: 65, fullMark: 150 },
];

const distributionData = [
    { name: 'Text', value: 400 },
    { name: 'Image', value: 300 },
    { name: 'Audio', value: 300 },
    { name: 'Video', value: 200 },
];

const AssetMetrics = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {/* Integrity Score Radar */}
            <motion.div
                className="glass p-6 rounded-2xl"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h3 className="text-xl font-bold mb-4 text-neon-blue">AI Integrity Score</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={featureData}>
                            <PolarGrid stroke="#ffffff20" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 150]} stroke="#ffffff20" />
                            <Radar
                                name="Asset"
                                dataKey="A"
                                stroke="#00f0ff"
                                strokeWidth={2}
                                fill="#00f0ff"
                                fillOpacity={0.3}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Data Distribution Bar */}
            <motion.div
                className="glass p-6 rounded-2xl"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <h3 className="text-xl font-bold mb-4 text-neon-green">Data Distribution</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={distributionData}>
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="value" fill="#0aff00" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </div>
    );
};

export default AssetMetrics;
