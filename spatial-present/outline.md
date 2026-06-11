# Singular Value Decomposition - A Guided Tour

> Linear handout derived from the spatial presentation model — 15 beats across The Atrium of Linear Maps and Inside the Decomposition.

## Welcome
*The Atrium of Linear Maps · Entrance Tablet*

### Singular Value Decomposition

Welcome to the Atrium of Linear Maps. Tonight we take one idea - that every matrix is a geometric transformation - and follow it through a glowing prism into the matrix itself.

Follow the carved route, or wander. Every exhibit keeps its place in the story.

**Narration:** Welcome to the Atrium of Linear Maps. Tonight we follow a single idea: every matrix is a geometric transformation. We will walk the length of this gallery, and then step through a prism into the matrix itself.

**Speaker notes:** Set the premise: this is not a slide deck, it is a building. Tonight's one idea is that every matrix is a geometric transformation, and SVD is its anatomy. The route runs the hall, then through the prism into the matrix itself.

## A matrix is a transformation
*The Atrium of Linear Maps · West Wall - The Transformation*

### A Matrix Is a Transformation

Multiplying by a matrix A bends space: it rotates, stretches, and shears every vector at once. The Singular Value Decomposition is the claim that ANY such map, however tangled, is only three plain steps:

rotate  ->  stretch along axes  ->  rotate again.

**Narration:** Multiplying by a matrix bends space. It rotates, stretches, and shears every vector at once. The singular value decomposition is the promise that any such map, however tangled, is only three plain steps: rotate, stretch along axes, and rotate again.

**Speaker notes:** Anchor the whole talk here: any matrix rotates, stretches, and shears space. SVD's promise is that this is always just rotate, stretch along axes, rotate. Three steps, no exceptions.

## The geometric picture
*The Atrium of Linear Maps · East Wall - The Geometric Picture*

*Image — The unit circle becomes an ellipse*: Diagram: on the left, a unit circle with two orthonormal vectors v1 and v2; a large arrow labelled A maps it to the right, where it has become a tilted ellipse whose semi-axes are sigma1 times u1 and sigma2 times u2. The caption reads A = U Sigma V-transpose, with sigma1 = 2.46 and sigma2 = 0.94.

**Narration:** Here is the one picture to remember. A matrix sends the unit circle to an ellipse. The lengths of the ellipse's axes are the singular values, and their directions are the singular vectors. Everything else tonight is bookkeeping around this picture.

**Speaker notes:** The one picture to remember: the unit circle maps to an ellipse. The semi-axis lengths are the singular values; their directions are the left singular vectors. Everything else is bookkeeping around this.

## Image compression
*The Atrium of Linear Maps · West Wall - Image Compression*

*Image — Image compression by truncated SVD*: A montage of the same grayscale image reconstructed at rank 2, 8, 24, and full rank. At rank 2 only broad blobs are visible; by rank 24 the letters S V D and concentric rings are sharp. Each low-rank panel stores only a small percentage of the original data.

**Narration:** Let us make that concrete. An image is just a matrix of pixel values. Keep only the largest singular values, and most of the picture survives at a fraction of the data. At rank two you see only broad strokes. By rank twenty four, the letters are sharp.

**Speaker notes:** Make it concrete: an image is a matrix of pixel values. Keep the top few singular values and you keep the picture while throwing away most of the numbers. Point out the ringing at rank 2 versus the crisp rank 24.

## Adding the layers
*The Atrium of Linear Maps · East Wall - Reconstruction Film*

*Film — Rebuilding an image one rank at a time*: An animation reconstructing a grayscale image as its rank climbs from 1 to 64. A side panel shows the singular value spectrum filling in as each layer is added; the picture sharpens fastest over the first few ranks.

**Narration:** Watch the image rebuild itself, one rank at a time. Each frame adds a single rank one layer. The first few layers do almost all of the work. After that, the picture barely changes, because the singular values have already collapsed.

**Speaker notes:** Let the film run. Each frame adds one rank-one layer; watch the image snap into focus over the first handful of ranks and barely change after. The side spectrum shows why: the singular values have already collapsed.

## How few components you need
*The Atrium of Linear Maps · Hologram - Variance Captured*

### Variance captured by the top k components

Cumulative variance captured by the leading singular components: top 1 gives 62%, top 2 gives 81%, top 3 gives 91%, top 4 gives 96%, top 5 gives 99%. A handful of components explain almost all of the structure - the basis of dimensionality reduction and PCA.

| | |
| --- | --- |
| top 1 | 62 % |
| top 2 | 81 % |
| top 3 | 91 % |
| top 4 | 96 % |
| top 5 | 99 % |

**Narration:** Here is the same idea as a number. The top five components already capture ninety nine percent of the variance. This is the engine behind principal component analysis: keep the directions that matter, and drop the rest.

**Speaker notes:** The same idea as a number: the top five components already capture 99% of the variance. This is the engine of PCA and dimensionality reduction - keep the directions that matter, drop the rest.

## The decomposition
*The Atrium of Linear Maps · East Wall - The Decomposition*

### A = U S V^T

The three steps, written down. V^T rotates the input axes onto the coordinate axes; S, the diagonal matrix of singular values, stretches each axis; U rotates the result into place.

The columns of U and V are orthonormal, S is diagonal and non-negative, and every real matrix has such a decomposition.

**Narration:** Now we can name the parts. A equals U, S, V transpose. V transpose rotates the input onto the right axes. S stretches each axis by a singular value. And U rotates the result into place. Three steps, written as three matrices.

**Speaker notes:** Now name the parts: A = U S V-transpose. V-transpose is the first rotation, S the stretches, U the second rotation. Orthonormal columns in U and V, non-negative diagonal in S. Tie each symbol back to the ellipse picture.

## Why it matters
*The Atrium of Linear Maps · The Strang Quote*

### After Gilbert Strang

"The singular value decomposition is a high point of linear algebra: every matrix, no matter how it tilts or stretches space, hides an orthonormal frame in which it acts as a simple diagonal scaling."

**Narration:** Why does this matter? Because in the right orthonormal frame, every matrix, no matter how it tilts or stretches space, is just a diagonal scaling. That frame is exactly what the singular value decomposition finds.

**Speaker notes:** Read the quote slowly. The punchline of linear algebra: in the right orthonormal frame, every matrix is just a diagonal scaling. That frame is exactly what SVD finds.

## The spectrum sky
*The Atrium of Linear Maps · The Spectrum Sky*

### The singular value spectrum

The singular values of a sample matrix, plotted by index on a logarithmic vertical axis: 18.4, 9.7, 5.1, 2.8, 1.3, 0.62, 0.28, 0.11. They fall off quickly - the steep decay is exactly what makes low-rank approximation work.

| | index k | singular value |
| --- | --- | --- |
| k=1 | 1 | 18.4 |
| k=2 | 2 | 9.7 |
| k=3 | 3 | 5.1 |
| k=4 | 4 | 2.8 |
| k=5 | 5 | 1.3 |
| k=6 | 6 | 0.62 |
| k=7 | 7 | 0.28 |
| k=8 | 8 | 0.11 |

**Narration:** Look up. Each star above the back wall is a singular value, placed by its index. They fall away steeply, and that steep descent is the whole reason compression works: most of the matrix lives in the first few directions.

**Speaker notes:** Each star is a singular value, plotted by index on a logarithmic axis. The steep descent is the whole reason compression and PCA work - most of the matrix lives in the first few directions. Then advance to the prism.

## The prism threshold
*The Atrium of Linear Maps · The Prism*

### The Prism

Every gallery keeps one door it rarely opens. Ours is made of light.

Step up to the prism. Beyond it the matrix comes apart into the pieces it was always made of.

**Narration:** Every gallery keeps one door it rarely opens. Ours is made of light. White light enters the prism, and a spectrum comes out: decomposition, made visible. Step up to the lens, and we will go through it.

**Speaker notes:** Build anticipation. White light goes in, a spectrum comes out - the prism is decomposition made visible. Ask the room what is inside a matrix, then advance through the lens.

## Inside the matrix
*Inside the Decomposition · Arrival in the Vector Space*

### Inside the Matrix

You have passed through the lens. Around you is the vector space itself. The pale ellipsoid ahead is the image of the unit sphere; the bright arrows are its singular axes.

**Narration:** You have passed through the lens. Around you is the vector space itself. The pale shape ahead is the image of the unit sphere, and the bright arrows are its singular axes: the wall diagram, made solid.

**Speaker notes:** Pause and let the scale shift land. We are inside the vector space now. The ellipsoid ahead is the image of the unit sphere; the arrows are the singular axes from the wall diagram, made solid.

## The ellipsoid
*Inside the Decomposition · Plate - The Ellipsoid*

### The Ellipsoid and Its Axes

Send every unit vector through A and their tips trace this ellipsoid. Its longest axis is the first singular value and direction; the shortest is the last.

A sphere goes in, an ellipsoid comes out. That is the whole geometry of SVD.

**Narration:** Send every unit vector through the matrix, and their tips trace this ellipsoid. Its longest axis is the first singular value. Its shortest is the last. A sphere goes in, an ellipsoid comes out. That is the whole geometry of the decomposition.

**Speaker notes:** This is the unit circle picture in 3D: a sphere mapped to an ellipsoid. The longest axis is the first singular value and direction; the shortest is the last. Geometry first, formula second.

## Best rank-k approximation
*Inside the Decomposition · Hologram - Approximation Error*

### Approximation error vs rank k

Relative reconstruction error of the best rank-k approximation: 41% at rank 1, 22% at rank 2, 9% at rank 4, 3% at rank 8, 1% at rank 16. By the Eckart-Young theorem, truncating the SVD gives the best rank-k approximation that exists.

| | |
| --- | --- |
| k=1 | 41 % |
| k=2 | 22 % |
| k=4 | 9 % |
| k=8 | 3 % |
| k=16 | 1 % |

**Narration:** How good is a low rank approximation? The error falls fast: forty one percent at rank one, down to three percent at rank eight. And by the Eckart Young theorem, truncating the decomposition is not merely good. It is the best rank k approximation that exists.

**Speaker notes:** Quantify it: error falls fast as rank rises. The key theorem is Eckart-Young - the truncated SVD is provably the best rank-k approximation, not merely a good one. That is what makes it the tool of choice.

## The rank-one layers
*Inside the Decomposition · The Rank-One Layers*

### The Rank-One Layers

Each glowing sheet is one rank-one layer, sigma times u times v-transpose. Stacked and summed, they rebuild A exactly.

Brightest first: the layers fade as the singular values fall, which is why a few of them are almost the entire matrix.

**Narration:** Each glowing sheet here is one rank one layer: a singular value times an outer product. Stacked and summed, they rebuild the matrix exactly. The sheets dim as the singular values fall, which is why a few of them are almost the entire matrix.

**Speaker notes:** Pull the matrix apart: A is a sum of rank-one layers, each a singular value times an outer product. The sheets are sorted by brightness because the singular values fall - the first few are almost the whole matrix.

## Back up the prism
*Inside the Decomposition · Return Ring*

### Back Up the Prism

The tour returns the way it came - back through the lens, carrying a single picture: every matrix is a rotation, a set of stretches, and a rotation.

**Narration:** Our tour ends where every decomposition does: back in one piece. Carry a single sentence home with you. Every matrix is a rotation, a set of stretches, and a rotation. Thank you for walking the atrium tonight.

**Speaker notes:** Close the loop: back through the ring to the atrium. Leave them with the one sentence - rotation, stretches, rotation. Take questions standing at the prism.
