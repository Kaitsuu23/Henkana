import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../utils/constants.dart';

// ─── base shimmer box ─────────────────────────────────────────────────────────

class ShimmerBox extends StatelessWidget {
  final double width;
  final double height;
  final double borderRadius;

  const ShimmerBox({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = 8,
  });

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: const Color(AppConstants.cardColor),
      highlightColor: const Color(AppConstants.borderColor),
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: const Color(AppConstants.cardColor),
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }
}

// ─── home shimmer ─────────────────────────────────────────────────────────────

class HomeShimmer extends StatelessWidget {
  const HomeShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // hero banner
          Shimmer.fromColors(
            baseColor: const Color(AppConstants.cardColor),
            highlightColor: const Color(AppConstants.borderColor),
            child: Container(
              margin: const EdgeInsets.all(16),
              height: 200,
              decoration: BoxDecoration(
                color: const Color(AppConstants.cardColor),
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
          const SizedBox(height: 8),
          // two sections
          _ShimmerSection(),
          _ShimmerSection(),
        ],
      ),
    );
  }
}

class _ShimmerSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 10),
          child: Shimmer.fromColors(
            baseColor: const Color(AppConstants.cardColor),
            highlightColor: const Color(AppConstants.borderColor),
            child: Container(
              width: 140,
              height: 18,
              decoration: BoxDecoration(
                color: const Color(AppConstants.cardColor),
                borderRadius: BorderRadius.circular(6),
              ),
            ),
          ),
        ),
        SizedBox(
          height: 210,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: 5,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemBuilder: (_, __) => Shimmer.fromColors(
              baseColor: const Color(AppConstants.cardColor),
              highlightColor: const Color(AppConstants.borderColor),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 130,
                    height: 185,
                    decoration: BoxDecoration(
                      color: const Color(AppConstants.cardColor),
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    width: 100,
                    height: 11,
                    decoration: BoxDecoration(
                      color: const Color(AppConstants.cardColor),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

// ─── grid shimmer ─────────────────────────────────────────────────────────────

class GridShimmer extends StatelessWidget {
  final int count;
  const GridShimmer({super.key, this.count = 6});

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.all(12),
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        mainAxisExtent: 210.0,
      ),
      itemCount: count,
      itemBuilder: (_, __) => const ShimmerBox(
        width: double.infinity,
        height: 210.0,
        borderRadius: 10,
      ),
    );
  }
}

// ─── list shimmer ─────────────────────────────────────────────────────────────

class ListShimmer extends StatelessWidget {
  final int count;
  const ListShimmer({super.key, this.count = 5});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemCount: count,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (_, __) => Shimmer.fromColors(
        baseColor: const Color(AppConstants.cardColor),
        highlightColor: const Color(AppConstants.borderColor),
        child: Container(
          height: 110,
          decoration: BoxDecoration(
            color: const Color(AppConstants.cardColor),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Container(
                width: 80,
                decoration: const BoxDecoration(
                  color: Color(AppConstants.borderColor),
                  borderRadius:
                      BorderRadius.horizontal(left: Radius.circular(12)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: double.infinity,
                      height: 13,
                      decoration: BoxDecoration(
                        color: const Color(AppConstants.borderColor),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      width: 80,
                      height: 11,
                      decoration: BoxDecoration(
                        color: const Color(AppConstants.borderColor),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── detail shimmer ───────────────────────────────────────────────────────────

class DetailShimmer extends StatelessWidget {
  const DetailShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Shimmer.fromColors(
            baseColor: const Color(AppConstants.cardColor),
            highlightColor: const Color(AppConstants.borderColor),
            child: Container(
              height: 280,
              color: const Color(AppConstants.cardColor),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Shimmer.fromColors(
              baseColor: const Color(AppConstants.cardColor),
              highlightColor: const Color(AppConstants.borderColor),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _bar(0.7, 22),
                  const SizedBox(height: 8),
                  _bar(0.45, 14),
                  const SizedBox(height: 20),
                  _bar(1.0, 12),
                  const SizedBox(height: 6),
                  _bar(0.9, 12),
                  const SizedBox(height: 6),
                  _bar(0.8, 12),
                  const SizedBox(height: 24),
                  _bar(0.4, 18),
                  const SizedBox(height: 12),
                  ...List.generate(
                    4,
                    (_) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Container(
                        height: 44,
                        decoration: BoxDecoration(
                          color: const Color(AppConstants.cardColor),
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _bar(double widthFactor, double height) {
    return LayoutBuilder(
      builder: (_, c) => Container(
        width: c.maxWidth * widthFactor,
        height: height,
        decoration: BoxDecoration(
          color: const Color(AppConstants.cardColor),
          borderRadius: BorderRadius.circular(5),
        ),
      ),
    );
  }
}

// ─── watch shimmer ────────────────────────────────────────────────────────────

class WatchShimmer extends StatelessWidget {
  const WatchShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    // Fits inside the 16:9 player container — just a centered indicator
    return const Center(
      child: CircularProgressIndicator(
        color: Color(AppConstants.primaryColor),
        strokeWidth: 2.5,
      ),
    );
  }
}
