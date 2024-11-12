import React, { useState } from 'react';

function DataList({ items, onHover }) {
    const [hoveredItemId, setHoveredItemId] = useState(null);

    return (
        <div className="data-list">
            {items.map((item) => (
                <div
                    key={item.id}
                    onMouseOver={() => {
                        onHover(item);
                        setHoveredItemId(item.id);
                    }}
                    onMouseOut={() => setHoveredItemId(null)}
                    style={{
                        backgroundColor: item.id === hoveredItemId ? '#f0f0f0' : 'transparent',
                        padding: '10px',
                        marginBottom: '5px',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    {item.name}
                </div>
            ))}
        </div>
    );
}

export default DataList;
